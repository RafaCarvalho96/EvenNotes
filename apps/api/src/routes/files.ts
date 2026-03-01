import fs from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'
import { resolveWorkspacePath, WorkspaceBoundaryError } from '../utils/workspace-boundary.js'
import { config } from '../config.js'

const putBodySchema = z.object({
  path: z.string().min(1, 'path is required'),
  content: z.string(),
})

const renameBodySchema = z.object({
  from: z.string().min(1, 'from is required'),
  to: z.string().min(1, 'to is required'),
})

const postBodySchema = z.object({
  path: z.string().min(1, 'path is required'),
  content: z.string().optional().default(''),
})

export const filesRoute: FastifyPluginAsync = async (fastify) => {
  const workspaceRoot = config.WORKSPACE_ROOT

  fastify.addHook('preHandler', async (_request, reply) => {
    if (!workspaceRoot) {
      return reply.code(400).send({ error: 'WORKSPACE_ROOT environment variable is not set' })
    }
  })

  fastify.get<{ Querystring: { path?: string } }>('/api/files/content', async (request, reply) => {
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

  fastify.post('/api/files', async (request, reply) => {
    const parseResult = postBodySchema.safeParse(request.body)

    if (!parseResult.success) {
      return reply.code(400).send({ error: 'Invalid request body', details: parseResult.error.format() })
    }

    const { path: relativePath, content } = parseResult.data

    if (!relativePath.endsWith('.md')) {
      return reply.code(400).send({ error: 'path must have a .md extension' })
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

    const dir = path.dirname(resolvedFile)
    await fs.mkdir(dir, { recursive: true })

    try {
      await fs.writeFile(resolvedFile, content, { flag: 'wx', encoding: 'utf-8' })
    } catch (err: unknown) {
      if (
        err !== null &&
        typeof err === 'object' &&
        'code' in err &&
        (err as NodeJS.ErrnoException).code === 'EEXIST'
      ) {
        return reply.code(409).send({ error: 'File already exists' })
      }
      throw err
    }

    return reply.code(201).send({ path: relativePath, createdAt: new Date().toISOString() })
  })

  fastify.patch('/api/files/rename', async (request, reply) => {
    const parseResult = renameBodySchema.safeParse(request.body)

    if (!parseResult.success) {
      return reply.code(400).send({ error: 'Invalid request body', details: parseResult.error.format() })
    }

    const { from, to } = parseResult.data

    let resolvedFrom: string
    let resolvedTo: string

    try {
      resolvedFrom = resolveWorkspacePath(workspaceRoot, from)
    } catch (err) {
      if (err instanceof WorkspaceBoundaryError) {
        return reply.code(403).send({ error: err.message })
      }
      throw err
    }

    try {
      resolvedTo = resolveWorkspacePath(workspaceRoot, to)
    } catch (err) {
      if (err instanceof WorkspaceBoundaryError) {
        return reply.code(403).send({ error: err.message })
      }
      throw err
    }

    try {
      await fs.access(resolvedTo)
      return reply.code(409).send({ error: 'Destination file already exists' })
    } catch (err: unknown) {
      if (
        err === null ||
        typeof err !== 'object' ||
        !('code' in err) ||
        (err as NodeJS.ErrnoException).code !== 'ENOENT'
      ) {
        throw err
      }
    }

    try {
      await fs.rename(resolvedFrom, resolvedTo)
    } catch (err: unknown) {
      if (
        err !== null &&
        typeof err === 'object' &&
        'code' in err &&
        (err as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        return reply.code(404).send({ error: 'Source file not found' })
      }
      throw err
    }

    return reply.code(200).send({ from, to, renamedAt: new Date().toISOString() })
  })

  fastify.delete<{ Querystring: { path?: string } }>('/api/files', async (request, reply) => {
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
      await fs.unlink(resolvedFile)
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

    return reply.code(200).send({ path: relativePath, deletedAt: new Date().toISOString() })
  })
}
