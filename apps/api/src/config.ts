import { z } from 'zod'

// ─── Environment Schema ───────────────────────────────────────────────────────

const envSchema = z.object({
  // Server
  PORT: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 3001)),

  // Workspace
  WORKSPACE_ROOT: z.string().min(1, 'WORKSPACE_ROOT must be a non-empty path'),

  // Logging
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),

  // OpenAI (optional — pipeline will throw at runtime when actually needed)
  OPENAI_API_KEY: z.string().optional(),

  // LLM provider
  LLM_PROVIDER: z.enum(['mock', 'openai']).default('mock'),

  // Pipeline resilience
  PIPELINE_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 30_000)),
  PIPELINE_MAX_RETRIES: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 2)),

  // LangSmith (all optional)
  LANGSMITH_API_KEY: z.string().optional(),
  LANGCHAIN_TRACING_V2: z.string().optional(),
  LANGCHAIN_PROJECT: z.string().optional(),
})

// ─── Config singleton ─────────────────────────────────────────────────────────

function loadConfig() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    console.error(
      `[EvenNotes] Fatal: invalid environment configuration:\n${issues}\n` +
        'Copy .env.example to .env.local and fill in required values.',
    )
    process.exit(1)
  }

  return result.data
}

export const config = loadConfig()

// ─── Typed re-exports ─────────────────────────────────────────────────────────

export type AppConfig = typeof config
