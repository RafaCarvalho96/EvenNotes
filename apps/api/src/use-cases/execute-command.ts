import fs from 'node:fs/promises'
import path from 'node:path'
import { SummarizePipeline, RewritePipeline, CreatePrdPipeline } from '@evennotes/ai-pipelines'
import type { PipelineRunner } from '@evennotes/ai-pipelines'
import { runsStore } from '../store/runs.js'
import { emitRunEvent } from '../store/runEvents.js'

interface CommandPayload {
  command: 'summarize' | 'rewrite' | 'create-prd' | 'chat'
  target: { type: string; path: string }
  params?: Record<string, unknown>
  provider?: string
}

const pipelineMap: Record<string, () => PipelineRunner> = {
  summarize: () => new SummarizePipeline(),
  rewrite: () => new RewritePipeline(),
  'create-prd': () => new CreatePrdPipeline(),
}

export async function executeCommand(
  payload: CommandPayload,
  runId: string,
  workspaceRoot: string,
): Promise<void> {
  try {
    const pipelineFactory = pipelineMap[payload.command]
    if (!pipelineFactory) {
      const current = runsStore.get(runId)!
      runsStore.set(runId, { ...current, status: 'failed' })
      emitRunEvent({ type: 'run.failed', runId, payload: { error: `Unknown command: ${payload.command}` } })
      return
    }

    const targetPath = payload.target.path
    const resolvedPath = path.isAbsolute(targetPath)
      ? targetPath
      : path.resolve(workspaceRoot, targetPath)

    let content: string
    try {
      content = await fs.readFile(resolvedPath, 'utf-8')
    } catch {
      const current = runsStore.get(runId)!
      runsStore.set(runId, { ...current, status: 'failed' })
      emitRunEvent({ type: 'run.failed', runId, payload: { error: `File not found: ${targetPath}` } })
      return
    }

    const pipeline = pipelineFactory()
    const currentRun = runsStore.get(runId)!
    runsStore.set(runId, { ...currentRun, status: 'running' })
    emitRunEvent({ type: 'run.model_started', runId, payload: { command: payload.command } })

    for await (const event of pipeline.run({
      command: payload.command,
      content,
      params: payload.params,
      provider: payload.provider,
      runId,
    })) {
      if (event.type === 'token') {
        emitRunEvent({ type: 'run.token_stream', runId, payload: { token: event.value } })
      } else if (event.type === 'completed') {
        const completedAt = new Date().toISOString()
        const runBeforeComplete = runsStore.get(runId)!
        runsStore.set(runId, { ...runBeforeComplete, status: 'completed', output: event.output, completedAt })
        emitRunEvent({ type: 'run.completed', runId, payload: { output: event.output } })
      } else if (event.type === 'failed') {
        const runBeforeFail = runsStore.get(runId)!
        runsStore.set(runId, { ...runBeforeFail, status: 'failed' })
        emitRunEvent({ type: 'run.failed', runId, payload: { error: event.error } })
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
}
