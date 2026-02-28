import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'
import { SummarizePipeline, RewritePipeline, CreatePrdPipeline } from '@evennotes/ai-pipelines'
import type { PipelineRunner } from '@evennotes/ai-pipelines'
import { runsStore } from '../store/runs.js'
import { emitRunEvent } from '../store/runEvents.js'

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

    // Run pipeline asynchronously
    void (async () => {
      try {
        const workspaceRoot = process.env['WORKSPACE_ROOT'] ?? process.cwd()
        const targetPath = payload.target.path
        const resolvedPath = path.isAbsolute(targetPath)
          ? targetPath
          : path.resolve(workspaceRoot, targetPath)

        const content = await fs.readFile(resolvedPath, 'utf-8')

        const pipelineMap: Record<string, () => PipelineRunner> = {
          summarize: () => new SummarizePipeline(),
          rewrite: () => new RewritePipeline(),
          'create-prd': () => new CreatePrdPipeline(),
        }

        const pipelineFactory = pipelineMap[payload.command]
        if (!pipelineFactory) {
          const current = runsStore.get(runId)!
          runsStore.set(runId, { ...current, status: 'failed' })
          emitRunEvent({
            type: 'run.failed',
            runId,
            payload: { error: `Unknown command: ${payload.command}` },
          })
          return
        }

        const pipeline = pipelineFactory()

        const currentRun = runsStore.get(runId)!
        runsStore.set(runId, { ...currentRun, status: 'running' })

        emitRunEvent({ type: 'run.model_started', runId, payload: { command: payload.command } })

        for await (const event of pipeline.run({
          command: payload.command,
          content,
          params: payload.params as Record<string, unknown> | undefined,
          provider: payload.provider,
          runId,
        })) {
          if (event.type === 'token') {
            emitRunEvent({
              type: 'run.token_stream',
              runId,
              payload: { token: event.value },
            })
          } else if (event.type === 'completed') {
            const completedAt = new Date().toISOString()
            const runBeforeComplete = runsStore.get(runId)!
            runsStore.set(runId, {
              ...runBeforeComplete,
              status: 'completed',
              output: event.output,
              completedAt,
            })
            emitRunEvent({
              type: 'run.completed',
              runId,
              payload: { output: event.output },
            })
          } else if (event.type === 'failed') {
            const runBeforeFail = runsStore.get(runId)!
            runsStore.set(runId, { ...runBeforeFail, status: 'failed' })
            emitRunEvent({
              type: 'run.failed',
              runId,
              payload: { error: event.error },
            })
          }
        }
      } catch (err) {
        const current = runsStore.get(runId)!
        runsStore.set(runId, { ...current, status: 'failed' })
        emitRunEvent({
          type: 'run.failed',
          runId,
          payload: { error: err instanceof Error ? err.message : String(err) },
        })
      }
    })()

    return reply.code(202).send({
      runId,
      status: 'created',
      streamUrl: `/api/runs/${runId}/events`,
    })
  })
}
