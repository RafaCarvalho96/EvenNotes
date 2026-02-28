import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Create a temp workspace directory and set env before any app code is evaluated
const tmpDir = mkdtempSync(join(tmpdir(), 'evennotes-test-'));
process.env['WORKSPACE_ROOT'] = tmpDir;

// Dynamic import ensures env vars are set before config.ts is evaluated
const { buildApp } = await import('../app.js');

describe('API Routes', () => {
  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('GET /health → 200 { status: ok }', async () => {
    const app = buildApp();
    await app.ready();
    const res = await supertest(app.server).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    await app.close();
  });

  it('GET /api/workspace/tree → 200 array', async () => {
    const app = buildApp();
    await app.ready();
    const res = await supertest(app.server).get('/api/workspace/tree');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    await app.close();
  });
});
