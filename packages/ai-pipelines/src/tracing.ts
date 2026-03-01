/**
 * Optional LangSmith tracing helpers for ai-pipelines.
 *
 * Tracing is enabled only when BOTH of the following env-vars are set:
 *   LANGSMITH_API_KEY  – the LangSmith workspace secret key
 *   LANGCHAIN_TRACING_V2=true
 *
 * When those vars are absent the helpers are no-ops, so pipelines run
 * normally with zero side-effects and no startup errors.
 */

import { createLogger } from '@evennotes/observability'
const logger = createLogger('tracing')

export interface TraceContext {
  runName: string
  projectName: string
  tags: string[]
  startedAt: number
}

/**
 * Returns true when LangSmith tracing is configured and enabled.
 */
export function isTracingEnabled(): boolean {
  return !!(
    process.env['LANGSMITH_API_KEY'] &&
    process.env['LANGCHAIN_TRACING_V2'] === 'true'
  )
}

/**
 * Creates a trace context for a pipeline run.
 * Returns `null` when tracing is disabled so callers can skip tracing logic.
 */
export function startTrace(pipelineName: string, runId: string): TraceContext | null {
  if (!isTracingEnabled()) return null

  const ctx: TraceContext = {
    runName: `${pipelineName}:${runId}`,
    projectName: process.env['LANGCHAIN_PROJECT'] ?? 'evennotes',
    tags: [pipelineName, runId],
    startedAt: Date.now(),
  }

  // In a real integration you would call the LangSmith SDK here to open a run.
  // This stub records intent without introducing an SDK dependency.
  logger.info('trace:start', { runName: ctx.runName, project: ctx.projectName, tags: ctx.tags })

  return ctx
}

/**
 * Closes a trace context. No-op when `ctx` is null (tracing disabled).
 */
export function endTrace(ctx: TraceContext | null, output?: string, error?: string): void {
  if (!ctx) return

  const durationMs = Date.now() - ctx.startedAt

  logger.info(error ? 'trace:failed' : 'trace:completed', {
    runName: ctx.runName,
    project: ctx.projectName,
    durationMs,
    ...(error ? { error } : {}),
    hasOutput: !!output,
  })
}
