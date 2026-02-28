import fs from 'node:fs/promises'
import { Command } from 'commander'
import { apiFetch, consumeSSE } from '../lib/api.js'
import type { TokenPayload, FailedPayload } from '../lib/api.js'

type RunCreatedResponse = {
  runId: string
  status: string
  streamUrl: string
}

async function executeRun(command: string, filePath: string): Promise<void> {
  // Verify the local file exists before calling the API
  try {
    await fs.access(filePath)
  } catch {
    console.error(`Error: File not found — ${filePath}`)
    process.exit(1)
  }

  let runId: string

  try {
    const response = await apiFetch('/api/commands/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        target: { type: 'file', path: filePath },
      }),
    })

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      console.error(`Error: ${body.error ?? `API returned status ${response.status}`}`)
      process.exit(1)
    }

    const data = (await response.json()) as RunCreatedResponse
    runId = data.runId
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`Error: Unable to reach the API — ${message}`)
    process.exit(1)
  }

  // Connect to SSE stream
  const apiBase = process.env['API_URL'] ?? 'http://localhost:3001'
  const sseUrl = `${apiBase}/api/runs/${runId}/events`

  let exitCode = 0

  try {
    await consumeSSE(sseUrl, async (event) => {
      if (event.type === 'run.token_stream') {
        const payload = event.payload as TokenPayload
        process.stdout.write(payload.token)
      } else if (event.type === 'run.completed') {
        process.stdout.write('\n')
      } else if (event.type === 'run.failed') {
        const payload = event.payload as FailedPayload
        process.stderr.write(`\nError: ${payload.error}\n`)
        exitCode = 1
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`Error: SSE stream failed — ${message}`)
    process.exit(1)
  }

  process.exit(exitCode)
}

export function registerRunCommand(program: Command): void {
  const run = program
    .command('run')
    .description('Execute an AI pipeline on a Markdown file')

  run
    .command('summarize <path>')
    .description('Summarize the content of a Markdown file')
    .action(async (filePath: string) => {
      await executeRun('summarize', filePath)
    })

  run
    .command('rewrite <path>')
    .description('Rewrite the content of a Markdown file with improved clarity')
    .action(async (filePath: string) => {
      await executeRun('rewrite', filePath)
    })

  run
    .command('create-prd <path>')
    .description('Generate a Product Requirements Document from a Markdown file')
    .action(async (filePath: string) => {
      await executeRun('create-prd', filePath)
    })
}
