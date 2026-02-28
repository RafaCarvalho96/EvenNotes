import { getProvider } from '@evennotes/ai-core'
import { createLogger } from '@evennotes/observability'
import { CREATE_PRD_PROMPT, buildPrompt } from '@evennotes/prompts'
import type { PipelineEvent, PipelineInput, PipelineRunner } from './types.js'
import { startTrace, endTrace } from './tracing.js'
import { withTimeout, withRetry, getPipelineTimeout, getMaxRetries } from './resilience.js'

const MAX_CONTENT_LENGTH = 8000
const logger = createLogger('CreatePrdPipeline')

// ─── CreatePrdPipeline ────────────────────────────────────────────────────────

export class CreatePrdPipeline implements PipelineRunner {
  async *run(input: PipelineInput): AsyncIterable<PipelineEvent> {
    const startedAt = Date.now()
    const trace = startTrace('create-prd', input.runId)

    try {
      // Stage 1 – Input resolution
      if (!input.content || input.content.trim().length === 0) {
        const error = 'Content is empty. Please provide context to generate a PRD.'
        logger.error('pipeline failed: empty content', { runId: input.runId, pipeline: 'create-prd' })
        endTrace(trace, undefined, error)
        yield { type: 'failed', error }
        return
      }

      // Stage 2 – Context collection (truncate if needed)
      let context = input.content
      if (context.length > MAX_CONTENT_LENGTH) {
        logger.warn('content truncated', { runId: input.runId, original: context.length, truncated: MAX_CONTENT_LENGTH })
        context = context.slice(0, MAX_CONTENT_LENGTH)
      }

      // Stage 3 – Prompt assembly
      const { system, user } = buildPrompt(CREATE_PRD_PROMPT, { context })
      const fullPrompt = `${system}\n\n${user}`

      // Stage 4 – Model invocation (with timeout + retry)
      const provider = getProvider(input.provider)
      let output = ''
      const timeoutMs = getPipelineTimeout()
      const maxRetries = getMaxRetries()

      const tokens: string[] = await withTimeout(
        () => withRetry(async () => {
          const result: string[] = []
          for await (const token of provider.generate(fullPrompt)) {
            result.push(token)
          }
          return result
        }, maxRetries),
        timeoutMs,
      )

      for (const token of tokens) {
        output += token
        yield { type: 'token', value: token }
      }

      // Stage 5 – Post-processing
      const durationMs = Date.now() - startedAt
      logger.info('pipeline completed', { runId: input.runId, pipeline: 'create-prd', durationMs, outputLength: output.length })
      endTrace(trace, output)
      yield { type: 'completed', output }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const durationMs = Date.now() - startedAt
      logger.error('pipeline failed', { runId: input.runId, pipeline: 'create-prd', durationMs, error: message })
      endTrace(trace, undefined, message)
      yield { type: 'failed', error: message }
    }
  }
}
