import type { FastifyPluginAsync } from 'fastify'
import type { RunEvent } from '@evennotes/contracts'
import { runsStore } from '../store/runs.js'
import { runEventEmitter } from '../store/runEvents.js'

export const runsRoute: FastifyPluginAsync = async (fastify) => {
  // ── GET /api/runs/:id ────────────────────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>('/api/runs/:id', async (request, reply) => {
    const { id } = request.params
    const run = runsStore.get(id)

    if (!run) {
      return reply.code(404).send({ error: 'Run not found' })
    }

    return reply.code(200).send(run)
  })

  // ── GET /api/runs/:id/events  (SSE) ─────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>('/api/runs/:id/events', (request, reply) => {
    const { id } = request.params

    if (!runsStore.has(id)) {
      return reply.code(404).send({ error: 'Run not found' })
    }

    // Take over the raw socket so Fastify does not interfere.
    reply.hijack()

    const raw = reply.raw
    raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    const channel = `run:${id}`

    const sendEvent = (event: RunEvent) => {
      raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)

      // Server closes the stream after terminal events.
      if (event.type === 'run.completed' || event.type === 'run.failed') {
        runEventEmitter.removeListener(channel, sendEvent)
        raw.end()
      }
    }

    runEventEmitter.on(channel, sendEvent)

    // Clean up if the client disconnects early.
    request.raw.on('close', () => {
      runEventEmitter.removeListener(channel, sendEvent)
    })
  })
}
