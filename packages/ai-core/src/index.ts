import { ChatOpenAI } from '@langchain/openai'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HumanMessage } from '@langchain/core/messages'

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
  private apiKey: string

  constructor() {
    const apiKey = process.env['OPENAI_API_KEY']
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set.')
    }
    this.apiKey = apiKey
  }

  async *generate(prompt: string, options?: LlmOptions): AsyncIterable<string> {
    const model = new ChatOpenAI({
      openAIApiKey: this.apiKey,
      model: options?.model ?? 'gpt-4o-mini',
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
    })

    const stream = await model.stream([new HumanMessage(prompt)])

    for await (const chunk of stream) {
      const content = typeof chunk.content === 'string' ? chunk.content : ''
      if (content) {
        yield content
      }
    }
  }
}

// ─── GeminiLlmProvider ───────────────────────────────────────────────────────

export class GeminiLlmProvider implements ILlmProvider {
  private apiKey: string

  constructor() {
    const apiKey = process.env['GOOGLE_API_KEY']
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is not set.')
    }
    this.apiKey = apiKey
  }

  async *generate(prompt: string, options?: LlmOptions): AsyncIterable<string> {
    const model = new ChatGoogleGenerativeAI({
      apiKey: this.apiKey,
      model: options?.model ?? 'gemini-2.0-flash',
      maxOutputTokens: options?.maxTokens,
      temperature: options?.temperature,
    })

    const stream = await model.stream([new HumanMessage(prompt)])

    for await (const chunk of stream) {
      const content = typeof chunk.content === 'string' ? chunk.content : ''
      if (content) {
        yield content
      }
    }
  }
}

// ─── providerRegistry ─────────────────────────────────────────────────────────

export const providerRegistry: Record<string, () => ILlmProvider> = {
  openai: () => new OpenAILlmProvider(),
  gemini: () => new GeminiLlmProvider(),
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
