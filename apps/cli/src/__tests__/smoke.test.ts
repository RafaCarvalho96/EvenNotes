/**
 * Smoke tests for CLI pipeline commands (summarize, rewrite, create-prd).
 *
 * These tests mock the API layer so no real server is required. They verify
 * that each command:
 *  1. accepts a valid .md file path,
 *  2. posts to /api/commands/run,
 *  3. streams SSE events to stdout, and
 *  4. exits with code 0 on success.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(__dirname, 'fixtures', 'sample.md')

// ─── Mock the API layer ────────────────────────────────────────────────────────

vi.mock('../lib/api.js', () => ({
  getApiUrl: () => 'http://localhost:3001',
  apiFetch: vi.fn(),
  consumeSSE: vi.fn(),
}))

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function runCommand(args: string[]): Promise<{ stdout: string; exitCode: number }> {
  const { apiFetch, consumeSSE } = await import('../lib/api.js')
  const mockedApiFetch = vi.mocked(apiFetch)
  const mockedConsumeSSE = vi.mocked(consumeSSE)

  // apiFetch returns a 202 with a runId
  mockedApiFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      runId: 'smoke-run-id-123',
      status: 'created',
      streamUrl: '/api/runs/smoke-run-id-123/events',
    }),
  } as Response)

  // consumeSSE simulates token stream + completion
  mockedConsumeSSE.mockImplementationOnce(async (_url, onEvent) => {
    await onEvent({ type: 'run.token_stream', runId: 'smoke-run-id-123', payload: { token: 'Mock ' } })
    await onEvent({ type: 'run.token_stream', runId: 'smoke-run-id-123', payload: { token: 'output.' } })
    await onEvent({ type: 'run.completed', runId: 'smoke-run-id-123', payload: {} })
  })

  // Capture stdout
  let capturedOutput = ''
  const originalWrite = process.stdout.write.bind(process.stdout)
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
    capturedOutput += String(chunk)
    return true
  })

  // Capture process.exit
  let capturedExitCode = -1
  vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
    capturedExitCode = typeof code === 'number' ? code : 0
    throw new Error(`process.exit(${capturedExitCode})`)
  })

  const { registerRunCommand } = await import('../commands/run.js')
  const program = new Command()
  program.exitOverride() // prevent Commander from calling process.exit on errors

  registerRunCommand(program)

  try {
    await program.parseAsync(['node', 'evennotes', ...args])
  } catch (err) {
    // Ignore process.exit throws; only re-throw unexpected errors
    if (!(err instanceof Error && err.message.startsWith('process.exit'))) {
      throw err
    }
  }

  process.stdout.write = originalWrite

  return { stdout: capturedOutput, exitCode: capturedExitCode === -1 ? 0 : capturedExitCode }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CLI smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('run summarize <path> streams output and exits 0', async () => {
    const { stdout, exitCode } = await runCommand(['run', 'summarize', FIXTURE])
    expect(stdout).toContain('Mock output.')
    expect(exitCode).toBe(0)
  })

  it('run rewrite <path> streams output and exits 0', async () => {
    const { stdout, exitCode } = await runCommand(['run', 'rewrite', FIXTURE])
    expect(stdout).toContain('Mock output.')
    expect(exitCode).toBe(0)
  })

  it('run create-prd <path> streams output and exits 0', async () => {
    const { stdout, exitCode } = await runCommand(['run', 'create-prd', FIXTURE])
    expect(stdout).toContain('Mock output.')
    expect(exitCode).toBe(0)
  })
})
