/**
 * Shared helpers for talking to the EvenNotes API.
 */

export function getApiUrl(): string {
  return process.env['API_URL'] ?? 'http://localhost:3001'
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${getApiUrl()}${path}`
  const response = await fetch(url, init)
  return response
}

// ─── SSE types (mirrors @evennotes/contracts) ─────────────────────────────────

export type RunEvent = {
  type: string
  runId: string
  payload?: unknown
}

export type TokenPayload = { token: string }
export type FailedPayload = { error: string }

/**
 * Consumes an SSE stream at `url`, calling `onEvent` for each parsed event.
 * Resolves when the stream ends or is closed by the server.
 */
export async function consumeSSE(
  url: string,
  onEvent: (event: RunEvent) => void | Promise<void>,
): Promise<void> {
  const response = await fetch(url, {
    headers: { Accept: 'text/event-stream' },
  })

  if (!response.ok) {
    throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error('SSE response body is null')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // SSE events are separated by double newlines
      const parts = buffer.split('\n\n')
      // The last element may be an incomplete event — keep it in the buffer
      buffer = parts.pop() ?? ''

      for (const part of parts) {
        const dataLine = part
          .split('\n')
          .find((line) => line.startsWith('data: '))
        if (dataLine) {
          const json = dataLine.slice(6).trim()
          if (json) {
            const event = JSON.parse(json) as RunEvent
            await onEvent(event)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
