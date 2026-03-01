// ─── PipelineInput ────────────────────────────────────────────────────────────

export type PipelineInput = {
  command: 'summarize' | 'rewrite' | 'create-prd' | 'chat'
  content: string
  params?: Record<string, unknown>
  provider?: string
  runId: string
}

// ─── PipelineEvent ────────────────────────────────────────────────────────────

export type PipelineEvent =
  | { type: 'token'; value: string }
  | { type: 'completed'; output: string }
  | { type: 'failed'; error: string }

// ─── PipelineOutput ───────────────────────────────────────────────────────────

export type PipelineOutput = {
  output: string
  runId: string
  command: string
  completedAt: string
}

// ─── PipelineRunner ───────────────────────────────────────────────────────────

export interface PipelineRunner {
  run(input: PipelineInput): AsyncIterable<PipelineEvent>
}
