import OpenAI from 'openai'

// ─── LlmOptions ───────────────────────────────────────────────────────────────

export type LlmOptions = {
  model?: string
  maxTokens?: number
  temperature?: number
}

// ─── ILlmProvider ─────────────────────────────────────────────────────────────

export interface ILlmProvider {
  generate(prompt: string, options?: LlmOptions): AsyncIterable<string>
}

// ─── MockLlmProvider ──────────────────────────────────────────────────────────

export class MockLlmProvider implements ILlmProvider {
  async *generate(prompt: string, _options?: LlmOptions): AsyncIterable<string> {
    const preview = prompt.slice(0, 50)
    const response = `Mock response for: ${preview}`
    const words = response.split(' ')
    for (const word of words) {
      yield word + ' '
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
}

// ─── OpenAILlmProvider ────────────────────────────────────────────────────────

export class OpenAILlmProvider implements ILlmProvider {
  private client: OpenAI

  constructor() {
    const apiKey = process.env['OPENAI_API_KEY']
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is not set. ' +
          'Please set it before using the OpenAI provider.',
      )
    }
    this.client = new OpenAI({ apiKey })
  }

  async *generate(prompt: string, options?: LlmOptions): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options?.model ?? 'gpt-4o-mini',
      max_tokens: options?.maxTokens,
      temperature: options?.temperature,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) {
        yield delta
      }
    }
  }
}

// ─── providerRegistry ─────────────────────────────────────────────────────────

export const providerRegistry: Record<string, () => ILlmProvider> = {
  openai: () => new OpenAILlmProvider(),
  mock: () => new MockLlmProvider(),
}

// ─── getProvider ──────────────────────────────────────────────────────────────

export function getProvider(name?: string): ILlmProvider {
  const providerName = name ?? process.env['LLM_PROVIDER'] ?? 'mock'
  const factory = providerRegistry[providerName]
  if (!factory) {
    throw new Error(
      `Unknown LLM provider: "${providerName}". ` +
        `Available providers: ${Object.keys(providerRegistry).join(', ')}`,
    )
  }
  return factory()
}
