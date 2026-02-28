import { EventEmitter } from 'node:events'
import type { RunEvent } from '@evennotes/contracts'

/**
 * Central EventEmitter that broadcasts RunEvents keyed by runId.
 * Each run has its own event channel: `run:<runId>`.
 */
export const runEventEmitter = new EventEmitter()
// Prevent Node.js warnings when many SSE clients listen to the same run.
runEventEmitter.setMaxListeners(100)

export function emitRunEvent(event: RunEvent): void {
  runEventEmitter.emit(`run:${event.runId}`, event)
}
