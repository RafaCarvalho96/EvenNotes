import fs from 'node:fs/promises'
import path from 'node:path'
import type { FastifyPluginAsync } from 'fastify'
import { resolveWorkspacePath, WorkspaceBoundaryError } from '../utils/workspace-boundary.js'

const IGNORED = new Set(['node_modules', '.git', '.DS_Store'])

async function collectMdFiles(dir: string, root: string): Promise<string[]> {
  const results: string[] = []

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true, encoding: 'utf-8' })

    for (const entry of entries) {
      if (IGNORED.has(entry.name)) continue

      const fullPath = path.join(dir, entry.name)

      // Guard against symlinks that could escape the workspace root
      try {
        resolveWorkspacePath(root, path.relative(root, fullPath))
      } catch (err) {
        if (err instanceof WorkspaceBoundaryError) continue
        throw err
      }

      if (entry.isDirectory()) {
        const nested = await collectMdFiles(fullPath, root)
        results.push(...nested)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(path.relative(root, fullPath).replace(/\\/g, '/'))
      }
    }
  } catch {
    return results
  }

  return results
}

export const workspaceRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/workspace/tree', async (_request, reply) => {
    const workspaceRoot = process.env.WORKSPACE_ROOT

    if (!workspaceRoot) {
      return reply.code(400).send({ error: 'WORKSPACE_ROOT environment variable is not set' })
    }

    try {
      await fs.access(workspaceRoot)
    } catch {
      return reply.code(400).send({ error: `WORKSPACE_ROOT does not exist: ${workspaceRoot}` })
    }

    const files = await collectMdFiles(workspaceRoot, workspaceRoot)

    return reply.code(200).send(files)
  })
}
