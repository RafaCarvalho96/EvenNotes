/**
 * Configurable timeout and retry helpers for pipeline execution.
 *
 * Configuration via environment variables:
 *   PIPELINE_TIMEOUT_MS   – max ms a pipeline may run (default: 30 000)
 *   PIPELINE_MAX_RETRIES  – max retry attempts on transient errors (default: 2)
 */

// ─── Config ───────────────────────────────────────────────────────────────────

export function getPipelineTimeout(): number {
  const raw = process.env['PIPELINE_TIMEOUT_MS']
  const val = raw ? parseInt(raw, 10) : 30_000
  return Number.isFinite(val) && val > 0 ? val : 30_000
}

export function getMaxRetries(): number {
  const raw = process.env['PIPELINE_MAX_RETRIES']
  const val = raw ? parseInt(raw, 10) : 2
  return Number.isFinite(val) && val >= 0 ? val : 2
}

// ─── Timeout ──────────────────────────────────────────────────────────────────

/**
 * Races `fn()` against a timeout. Rejects with a human-readable error if
 * `ms` elapses before `fn()` settles.
 */
export async function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Pipeline timed out after ${ms} ms`))
    }, ms)
  })

  try {
    const result = await Promise.race([fn(), timeoutPromise])
    return result
  } finally {
    clearTimeout(timer)
  }
}

// ─── Retry ────────────────────────────────────────────────────────────────────

/**
 * Returns true for transient errors that should be retried (HTTP 429, 503,
 * "rate limit" messages). Non-retriable errors (400, 401, etc.) return false.
 */
export function isRetriable(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('rate limit') ||
    msg.includes('service unavailable') ||
    msg.includes('too many requests')
  )
}

/**
 * Async exponential-backoff retry wrapper.
 *
 * @param fn          - async producer to attempt
 * @param maxRetries  - maximum number of additional attempts after the first
 * @returns the resolved value of `fn`
 * @throws the last error if all attempts exhaust
 */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 2): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err

      // Never retry non-transient errors
      if (!isRetriable(err)) throw err

      // No more retries left
      if (attempt === maxRetries) throw err

      // Exponential backoff: 500ms, 1 000ms, …
      const backoffMs = Math.pow(2, attempt) * 500
      await new Promise<void>((resolve) => setTimeout(resolve, backoffMs))
    }
  }

  throw lastError
}
