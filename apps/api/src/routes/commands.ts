import crypto from 'node:crypto'
import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'
import { runsStore } from '../store/runs.js'
import { emitRunEvent } from '../store/runEvents.js'
import { config } from '../config.js'
import { executeCommand } from '../use-cases/execute-command.js'

const commandTargetSchema = z.object({
  type: z.enum(['file', 'selection', 'pipeline']),
  path: z.string().min(1, 'target.path is required'),
  selection: z
    .object({
      start: z.number().int(),
      end: z.number().int(),
    })
    .optional(),
})

const commandPayloadSchema = z.object({
  command: z.enum(['summarize', 'rewrite', 'create-prd']),
  target: commandTargetSchema,
  params: z.record(z.unknown()).optional(),
  provider: z.string().optional(),
})

export const commandsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/commands/run', async (request, reply) => {
    const parseResult = commandPayloadSchema.safeParse(request.body)

    if (!parseResult.success) {
      return reply
        .code(400)
        .send({ error: 'Invalid request payload', details: parseResult.error.format() })
    }

    const payload = parseResult.data
    const runId = crypto.randomUUID()
    const now = new Date().toISOString()

    runsStore.set(runId, {
      id: runId,
      command: payload.command,
      status: 'created',
      createdAt: now,
    })

    emitRunEvent({ type: 'run.created', runId, payload: { status: 'created' } })

    void executeCommand(payload, runId, config.WORKSPACE_ROOT)

    return reply.code(202).send({
      runId,
      status: 'created',
      streamUrl: `/api/runs/${runId}/events`,
    })
  })
}
