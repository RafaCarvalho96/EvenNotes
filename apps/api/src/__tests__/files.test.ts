import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

// Set env vars before any app code is evaluated
const tmpDir = mkdtempSync(join(tmpdir(), 'evennotes-files-test-'))
process.env['WORKSPACE_ROOT'] = tmpDir

const { buildApp } = await import('../app.js')

describe('Files & Runs API Routes', () => {
  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('PUT /api/files/content', () => {
    it('creates a file in the workspace', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server)
        .put('/api/files/content')
        .send({ path: 'test-note.md', content: '# Hello\n\nTest content.' })

      expect(res.status).toBe(200)
      expect(res.body.path).toBe('test-note.md')
      expect(res.body.savedAt).toBeTruthy()

      // Verify the file was actually written
      const filePath = join(tmpDir, 'test-note.md')
      expect(existsSync(filePath)).toBe(true)
      const written = await readFile(filePath, 'utf-8')
      expect(written).toBe('# Hello\n\nTest content.')

      await app.close()
    })

    it('returns 400 for missing path', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server)
        .put('/api/files/content')
        .send({ content: 'Some content' })

      expect(res.status).toBe(400)
      await app.close()
    })
  })

  describe('GET /api/files/content', () => {
    it('returns file content written previously', async () => {
      const app = buildApp()
      await app.ready()

      // Write the file first
      await supertest(app.server)
        .put('/api/files/content')
        .send({ path: 'read-me.md', content: '# Read Test\n\nContent here.' })

      // Now read it back
      const res = await supertest(app.server).get(
        '/api/files/content?path=read-me.md',
      )

      expect(res.status).toBe(200)
      expect(res.body.path).toBe('read-me.md')
      expect(res.body.content).toBe('# Read Test\n\nContent here.')

      await app.close()
    })

    it('returns 404 for non-existent file', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server).get(
        '/api/files/content?path=does-not-exist.md',
      )

      expect(res.status).toBe(404)
      await app.close()
    })
  })

  describe('GET /api/runs/:id', () => {
    it('returns 404 for unknown runId', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server).get(
        '/api/runs/non-existent-run-id',
      )

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Run not found')

      await app.close()
    })
  })
})
