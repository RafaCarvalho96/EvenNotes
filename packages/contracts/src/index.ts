// ─── Command ──────────────────────────────────────────────────────────────────

export type CommandTarget = {
  type: 'file' | 'selection' | 'pipeline'
  path: string
  selection?: { start: number; end: number }
}

export type CommandPayload = {
  command: 'summarize' | 'rewrite' | 'create-prd' | 'chat'
  target: CommandTarget
  params?: Record<string, unknown>
  provider?: string
}

// ─── Run ──────────────────────────────────────────────────────────────────────

export type RunStatus =
  | 'created'
  | 'validating'
  | 'context_collected'
  | 'running'
  | 'completed'
  | 'failed'

export type Run = {
  id: string
  command: string
  status: RunStatus
  createdAt: string
  completedAt?: string
  output?: string
}

// ─── RunEvent ─────────────────────────────────────────────────────────────────

export type RunEventType =
  | 'run.created'
  | 'run.model_started'
  | 'run.token_stream'
  | 'run.completed'
  | 'run.failed'

export type RunEvent = {
  type: RunEventType
  runId: string
  payload?: unknown
}
