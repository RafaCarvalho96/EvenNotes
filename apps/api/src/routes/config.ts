import type { FastifyPluginAsync } from 'fastify'

// ─── Provider definitions ─────────────────────────────────────────────────────

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', envVar: 'OPENAI_API_KEY' },
  { id: 'gemini', name: 'Google Gemini', envVar: 'GOOGLE_API_KEY' },
  { id: 'mock', name: 'Mock (Testing)', envVar: null as string | null },
]

// ─── Pipeline definitions ─────────────────────────────────────────────────────

const PIPELINES = [
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Summarizes the content of a file or selection into a concise overview.',
  },
  {
    id: 'rewrite',
    name: 'Rewrite',
    description: 'Rewrites the content of a file or selection with improved clarity and style.',
  },
  {
    id: 'create-prd',
    name: 'Create PRD',
    description:
      'Generates a Product Requirements Document from rough notes or feature descriptions.',
  },
]

// ─── Route ───────────────────────────────────────────────────────────────────

export const configRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/config/providers', async (_request, reply) => {
    const providers = PROVIDERS.map(({ id, name, envVar }) => ({
      id,
      name,
      available: envVar === null ? true : Boolean(process.env[envVar]),
    }))
    return reply.code(200).send(providers)
  })

  fastify.get('/api/config/pipelines', async (_request, reply) => {
    return reply.code(200).send(PIPELINES)
  })
}
