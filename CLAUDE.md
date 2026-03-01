# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Dev (all apps in parallel via Turborepo)
pnpm dev

# Build all packages/apps (respects dependency order)
pnpm build

# Typecheck all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @evennotes/api test
pnpm --filter @evennotes/cli test
pnpm --filter @evennotes/ai-pipelines test

# Run a single test file
pnpm --filter @evennotes/api exec vitest run src/__tests__/routes.test.ts

# Docker dev stack (with hot sync)
pnpm docker:up        # start with watch mode
pnpm docker:down      # stop
pnpm docker:reset     # stop + remove volumes
pnpm docker:logs      # follow logs
```

Env setup: copy `.env.example` to `.env.local` and fill in values before running Docker. `WORKSPACE_ROOT` and `OPENAI_API_KEY` are the key variables. `LLM_PROVIDER` defaults to `mock` — no API key needed for local dev.

Pipeline resilience is tunable via `PIPELINE_TIMEOUT_MS` (default 30 000 ms) and `PIPELINE_MAX_RETRIES` (default 2).

## Architecture

### Monorepo layout

pnpm workspaces + Turborepo. Build order is enforced by `turbo.json` (`"dependsOn": ["^build"]`). All packages use ESM (`"type": "module"`). Packages export from `src/index.ts` directly (no pre-compilation needed by consumers in dev).

```
apps/api        – Fastify backend (port 3001)
apps/web        – Vite + React frontend (port 5173)
apps/cli        – Commander.js CLI binary
packages/contracts      – shared TypeScript types (Run, RunEvent, CommandPayload)
packages/ai-core        – ILlmProvider interface + mock/openai/gemini adapters
packages/ai-pipelines   – SummarizePipeline, RewritePipeline, CreatePrdPipeline
packages/prompts        – versioned prompt templates
packages/markdown-core  – markdown parse/transform utilities (stub)
packages/workspace-core – file listing and path utilities (stub)
packages/observability  – logging/tracing helpers
packages/ui             – shared React components (stub)
packages/test-utils     – test helpers (stub)
```

Packages marked **(stub)** export empty/placeholder implementations — they exist for dependency graph completeness and are ready to be filled in.

### AI pipeline execution flow

1. Web UI opens `CommandPalette` (Ctrl+K) → user picks command + optional context.
2. `RunPanel` sends `POST /api/commands/run` with `{ command, target, provider? }`.
3. API creates a `Run` record (in-memory `Map`), returns `{ runId, streamUrl }` with HTTP 202.
4. API runs the pipeline **asynchronously** — the matching `PipelineRunner` (`SummarizePipeline` etc.) is an `AsyncIterable<PipelineEvent>` that yields `token | completed | failed` events.
5. Each event is forwarded to an `EventEmitter` keyed by `run:<runId>`.
6. `RunPanel` subscribes to `GET /api/runs/:id/events` (SSE). The SSE handler listens on the same emitter and writes `data: <json>\n\n` — closing the stream on `run.completed` or `run.failed`.
7. Once complete, `App.tsx` switches `appMode` to `"result"` and shows `DiffOrResultPanel`.

### Adding a new pipeline

1. Add a prompt template in `packages/prompts/src/` (use `PromptTemplate` type, list `placeholders`).
2. Create `packages/ai-pipelines/src/<name>-pipeline.ts` extending `BasePipeline`.
3. Register it in the `pipelineMap` inside `apps/api/src/use-cases/execute-command.ts`.
4. Add the command name to the `CommandPayload` union in `packages/contracts/src/index.ts`.

### Adding a new LLM provider

1. Implement `ILlmProvider` from `packages/ai-core/src/provider.ts` (async generator for tokens).
2. Register the factory in `providerRegistry` inside `packages/ai-core/src/registry.ts`.
3. Add the provider name to the `LLM_PROVIDER` Zod enum in `apps/api/src/config.ts`.

### LLM provider selection

`packages/ai-core` exports `getProvider(name?)` which reads `LLM_PROVIDER` env var. The `providerRegistry` maps `mock | openai | gemini` to factory functions. Pipelines call `getProvider()` at runtime — no provider is instantiated until a command actually runs.

### Security boundary

All file paths go through `resolveWorkspacePath(base, userPath)` in `apps/api/src/utils/workspace-boundary.ts`. It throws `WorkspaceBoundaryError` (→ HTTP 403) if the resolved path escapes `WORKSPACE_ROOT`.

### Frontend state machine

`App.tsx` owns all state. The right panel is driven by `appMode`:
- `"preview"` → `MarkdownPreview` (debounced, 300 ms)
- `"running"` → `RunPanel` (SSE streaming)
- `"result"` → `DiffOrResultPanel` (accept/replace/save-as)

The editor (`MarkdownEditor`, CodeMirror 6) exposes an imperative `ref` handle with `replaceSelection()` so `DiffOrResultPanel` can patch selected text in place.

### API config validation

`apps/api/src/config.ts` parses env vars with Zod at startup — invalid config causes a descriptive `process.exit(1)` before the server binds. All sensitive keys are redacted from Pino logs.

### Vite proxy

`apps/web/vite.config.ts` proxies `/api/*` → `http://localhost:3001` so the frontend can use relative URLs in development without CORS issues.

### Prompt templates

`packages/prompts` stores versioned templates with a `system` message, a `user` message with `{placeholder}` tokens, and a `placeholders` array. The `CREATE_PRD_PROMPT` generates output in **Portuguese (pt-BR)** — keep that locale when modifying it.

### Testing conventions

- API tests use `mkdtempSync()` to create an isolated temp workspace; set `WORKSPACE_ROOT` before any dynamic import of the server.
- Vitest is used across all packages. Supertest is used for HTTP-level API assertions.
- CLI has smoke tests (`src/__tests__/smoke.test.ts`) that invoke the binary directly.
