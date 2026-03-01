import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs'
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

  describe('POST /api/files', () => {
    it('creates a new .md file and returns 201', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server)
        .post('/api/files')
        .send({ path: 'new-note.md', content: '# New Note' })

      expect(res.status).toBe(201)
      expect(res.body.path).toBe('new-note.md')
      expect(res.body.createdAt).toBeTruthy()
      expect(existsSync(join(tmpDir, 'new-note.md'))).toBe(true)

      await app.close()
    })

    it('returns 400 when path has no .md extension', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server)
        .post('/api/files')
        .send({ path: 'note-without-extension.txt' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('path must have a .md extension')

      await app.close()
    })

    it('returns 400 when path is empty', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server)
        .post('/api/files')
        .send({ path: '' })

      expect(res.status).toBe(400)

      await app.close()
    })

    it('returns 403 on path traversal attempt', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server)
        .post('/api/files')
        .send({ path: '../../../etc/passwd.md' })

      expect(res.status).toBe(403)

      await app.close()
    })

    it('returns 409 when file already exists', async () => {
      const app = buildApp()
      await app.ready()

      writeFileSync(join(tmpDir, 'already-exists.md'), '# Existing')

      const res = await supertest(app.server)
        .post('/api/files')
        .send({ path: 'already-exists.md', content: '# Duplicate' })

      expect(res.status).toBe(409)
      expect(res.body.error).toBe('File already exists')

      await app.close()
    })
  })

  describe('PATCH /api/files/rename', () => {
    it('renames a file and returns 200', async () => {
      const app = buildApp()
      await app.ready()

      writeFileSync(join(tmpDir, 'rename-source.md'), '# Source')

      const res = await supertest(app.server)
        .patch('/api/files/rename')
        .send({ from: 'rename-source.md', to: 'rename-dest.md' })

      expect(res.status).toBe(200)
      expect(res.body.from).toBe('rename-source.md')
      expect(res.body.to).toBe('rename-dest.md')
      expect(res.body.renamedAt).toBeTruthy()
      expect(existsSync(join(tmpDir, 'rename-source.md'))).toBe(false)
      expect(existsSync(join(tmpDir, 'rename-dest.md'))).toBe(true)

      await app.close()
    })

    it('returns 400 when payload is missing fields', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server)
        .patch('/api/files/rename')
        .send({ from: 'only-from.md' })

      expect(res.status).toBe(400)

      await app.close()
    })

    it('returns 400 when from is empty', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server)
        .patch('/api/files/rename')
        .send({ from: '', to: 'dest.md' })

      expect(res.status).toBe(400)

      await app.close()
    })

    it('returns 403 on path traversal in from', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server)
        .patch('/api/files/rename')
        .send({ from: '../../../etc/passwd', to: 'safe-dest.md' })

      expect(res.status).toBe(403)

      await app.close()
    })

    it('returns 403 on path traversal in to', async () => {
      const app = buildApp()
      await app.ready()

      writeFileSync(join(tmpDir, 'traversal-source.md'), '# Source')

      const res = await supertest(app.server)
        .patch('/api/files/rename')
        .send({ from: 'traversal-source.md', to: '../../../etc/evil.md' })

      expect(res.status).toBe(403)

      await app.close()
    })

    it('returns 404 when source file does not exist', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server)
        .patch('/api/files/rename')
        .send({ from: 'does-not-exist.md', to: 'dest-for-404.md' })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Source file not found')

      await app.close()
    })

    it('returns 409 when destination file already exists', async () => {
      const app = buildApp()
      await app.ready()

      writeFileSync(join(tmpDir, 'rename-conflict-src.md'), '# Source')
      writeFileSync(join(tmpDir, 'rename-conflict-dst.md'), '# Destination')

      const res = await supertest(app.server)
        .patch('/api/files/rename')
        .send({ from: 'rename-conflict-src.md', to: 'rename-conflict-dst.md' })

      expect(res.status).toBe(409)
      expect(res.body.error).toBe('Destination file already exists')

      await app.close()
    })
  })

  describe('DELETE /api/files', () => {
    it('deletes a file and returns 200', async () => {
      const app = buildApp()
      await app.ready()

      writeFileSync(join(tmpDir, 'to-delete.md'), '# Delete me')

      const res = await supertest(app.server)
        .delete('/api/files')
        .query({ path: 'to-delete.md' })

      expect(res.status).toBe(200)
      expect(res.body.path).toBe('to-delete.md')
      expect(res.body.deletedAt).toBeTruthy()
      expect(existsSync(join(tmpDir, 'to-delete.md'))).toBe(false)

      await app.close()
    })

    it('returns 403 on path traversal attempt', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server)
        .delete('/api/files')
        .query({ path: '../../../etc/passwd' })

      expect(res.status).toBe(403)

      await app.close()
    })

    it('returns 404 when file does not exist', async () => {
      const app = buildApp()
      await app.ready()

      const res = await supertest(app.server)
        .delete('/api/files')
        .query({ path: 'ghost-file.md' })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('File not found')

      await app.close()
    })
  })

  describe('POST /api/commands/run', () => {
    it('returns 202 with runId for command chat', async () => {
      const app = buildApp()
      await app.ready()

      writeFileSync(join(tmpDir, 'chat-target.md'), '# Chat Target\n\nSome content to chat about.')

      const res = await supertest(app.server)
        .post('/api/commands/run')
        .send({
          command: 'chat',
          target: { type: 'file', path: 'chat-target.md' },
          params: { userMessage: 'summarize this' },
        })

      expect(res.status).toBe(202)
      expect(res.body.runId).toBeTruthy()

      await app.close()
    })
  })
})
