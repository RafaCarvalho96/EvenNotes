import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GeminiLlmProvider } from './index.js'

vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    stream: vi.fn().mockResolvedValue(
      (async function* () {
        yield { content: 'Hello' }
        yield { content: '' } // empty chunk — should be ignored
        yield { content: ' world' }
      })(),
    ),
  })),
}))

describe('GeminiLlmProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  it('throws when GOOGLE_API_KEY is not set', () => {
    delete process.env['GOOGLE_API_KEY']
    expect(() => new GeminiLlmProvider()).toThrowError('GOOGLE_API_KEY')
  })

  it('yields non-empty tokens from stream', async () => {
    process.env['GOOGLE_API_KEY'] = 'test-key'
    const provider = new GeminiLlmProvider()

    const tokens: string[] = []
    for await (const token of provider.generate('Tell me something')) {
      tokens.push(token)
    }

    expect(tokens.length).toBeGreaterThan(0)
    // Empty chunks should be ignored
    expect(tokens.every((t) => t.length > 0)).toBe(true)
    expect(tokens.join('')).toBe('Hello world')
  })
})
