import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenAILlmProvider } from './index.js'

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    stream: vi.fn().mockResolvedValue(
      (async function* () {
        yield { content: 'Token1' }
        yield { content: '' } // empty chunk — should be ignored
        yield { content: ' Token2' }
      })(),
    ),
  })),
}))

describe('OpenAILlmProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  it('throws when OPENAI_API_KEY is not set', () => {
    delete process.env['OPENAI_API_KEY']
    expect(() => new OpenAILlmProvider()).toThrowError('OPENAI_API_KEY')
  })

  it('yields non-empty tokens from stream', async () => {
    process.env['OPENAI_API_KEY'] = 'sk-test-key'
    const provider = new OpenAILlmProvider()

    const tokens: string[] = []
    for await (const token of provider.generate('Say hello')) {
      tokens.push(token)
    }

    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens.every((t) => t.length > 0)).toBe(true)
    expect(tokens.join('')).toBe('Token1 Token2')
  })
})
