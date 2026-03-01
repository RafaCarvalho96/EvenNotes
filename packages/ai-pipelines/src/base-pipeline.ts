import { getProvider } from '@evennotes/ai-core'
import { createLogger } from '@evennotes/observability'
import type { PipelineEvent, PipelineInput } from './types.js'
import { startTrace, endTrace } from './tracing.js'
import { withTimeout, withRetry } from './resilience.js'
import { MAX_CONTENT_LENGTH } from './constants.js'

export async function* runPipeline(
  input: PipelineInput,
  buildPromptFn: (truncatedContent: string) => string,
  pipelineName: string,
  emptyContentError: string,
): AsyncIterable<PipelineEvent> {
  const logger = createLogger(pipelineName)
  const startedAt = Date.now()
  const trace = startTrace(pipelineName, input.runId)

  try {
    // Stage 1 – Input resolution
    if (!input.content || input.content.trim().length === 0) {
      logger.error('pipeline failed: empty content', { runId: input.runId, pipeline: pipelineName })
      endTrace(trace, undefined, emptyContentError)
      yield { type: 'failed', error: emptyContentError }
      return
    }

    // Stage 2 – Context collection (truncate if needed)
    let content = input.content
    if (content.length > MAX_CONTENT_LENGTH) {
      logger.warn('content truncated', { runId: input.runId, original: content.length, truncated: MAX_CONTENT_LENGTH })
      content = content.slice(0, MAX_CONTENT_LENGTH)
    }

    // Stage 3 – Prompt assembly (delegated to caller)
    const fullPrompt = buildPromptFn(content)

    // Stage 4 – Model invocation (with timeout + retry)
    const provider = getProvider(input.provider)
    let output = ''
    const timeoutMs = process.env['PIPELINE_TIMEOUT_MS'] ? parseInt(process.env['PIPELINE_TIMEOUT_MS'], 10) : 30_000
    const maxRetries = process.env['PIPELINE_MAX_RETRIES'] ? parseInt(process.env['PIPELINE_MAX_RETRIES'], 10) : 2

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
    logger.info('pipeline completed', { runId: input.runId, pipeline: pipelineName, durationMs, outputLength: output.length })
    endTrace(trace, output)
    yield { type: 'completed', output }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const durationMs = Date.now() - startedAt
    logger.error('pipeline failed', { runId: input.runId, pipeline: pipelineName, durationMs, error: message })
    endTrace(trace, undefined, message)
    yield { type: 'failed', error: message }
  }
}
