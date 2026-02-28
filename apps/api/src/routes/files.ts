import fs from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'
import { resolveWorkspacePath, WorkspaceBoundaryError } from '../utils/workspace-boundary.js'

const putBodySchema = z.object({
  path: z.string().min(1, 'path is required'),
  content: z.string(),
})

export const filesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: { path?: string } }>('/api/files/content', async (request, reply) => {
    const workspaceRoot = process.env.WORKSPACE_ROOT

    if (!workspaceRoot) {
      return reply.code(400).send({ error: 'WORKSPACE_ROOT environment variable is not set' })
    }

    const relativePath = request.query.path

    if (!relativePath || relativePath.trim() === '') {
      return reply.code(400).send({ error: 'Query parameter "path" is required and cannot be empty' })
    }

    let resolvedFile: string
    try {
      resolvedFile = resolveWorkspacePath(workspaceRoot, relativePath)
    } catch (err) {
      if (err instanceof WorkspaceBoundaryError) {
        return reply.code(403).send({ error: err.message })
      }
      throw err
    }

    try {
      const content = await fs.readFile(resolvedFile, 'utf-8')
      return reply.code(200).send({ path: relativePath, content })
    } catch (err: unknown) {
      if (
        err !== null &&
        typeof err === 'object' &&
        'code' in err &&
        (err as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        return reply.code(404).send({ error: 'File not found' })
      }
      throw err
    }
  })

  fastify.put('/api/files/content', async (request, reply) => {
    const parseResult = putBodySchema.safeParse(request.body)

    if (!parseResult.success) {
      return reply.code(400).send({ error: 'Invalid request body', details: parseResult.error.format() })
    }

    const { path: relativePath, content } = parseResult.data

    const workspaceRoot = process.env.WORKSPACE_ROOT

    if (!workspaceRoot) {
      return reply.code(400).send({ error: 'WORKSPACE_ROOT environment variable is not set' })
    }

    let resolvedFile: string
    try {
      resolvedFile = resolveWorkspacePath(workspaceRoot, relativePath)
    } catch (err) {
      if (err instanceof WorkspaceBoundaryError) {
        return reply.code(403).send({ error: err.message })
      }
      throw err
    }

    await fs.writeFile(resolvedFile, content, 'utf-8')

    return reply.code(200).send({ path: relativePath, savedAt: new Date().toISOString() })
  })
}
