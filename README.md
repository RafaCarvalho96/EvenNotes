# EvenNotes

A TypeScript monorepo for AI-powered note editing and processing pipelines.

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24+) with BuildKit enabled
- [pnpm](https://pnpm.io/) v10+
- Node.js v22+

### Local Development with Docker

1. **Copy the environment template**

   ```bash
   cp .env.example .env.local
   ```

2. **Fill in required variables** in `.env.local`

   | Variable | Required | Description |
   |---|---|---|
   | `PORT_API` | No | API port (default: `3001`) |
   | `PORT_WEB` | No | Web port (default: `5173`) |
   | `WORKSPACE_ROOT` | No | Workspace directory (default: `./workspace`) |
   | `LOG_LEVEL` | No | Log verbosity (default: `info`) |
   | `OPENAI_API_KEY` | **Yes (for AI)** | OpenAI API key |
   | `LANGSMITH_API_KEY` | No | LangSmith tracing key |
   | `LANGSMITH_TRACING` | No | Enable tracing (default: `false`) |
   | `LLM_PROVIDER` | No | `mock` or `openai` (default: `mock`) |

3. **Start the full stack**

   ```bash
   pnpm docker:up
   ```

   This starts both services with file-sync watch mode — source changes are reflected inside the containers instantly without a full rebuild.

### Accessing the services

| Service | URL |
|---|---|
| Web (Vite / React) | <http://localhost:5173> (or `localhost:${PORT_WEB}`) |
| API | <http://localhost:3001> (or `localhost:${PORT_API}`) |
| API health check | <http://localhost:3001/health> |

### Docker convenience scripts

| Command | Description |
|---|---|
| `pnpm docker:up` | Start services in watch mode |
| `pnpm docker:down` | Stop and remove containers |
| `pnpm docker:reset` | Stop containers **and remove volumes** (clears run history) |
| `pnpm docker:logs` | Follow logs for all services |

### Optional profiles

```bash
# Start with observability stack (OpenTelemetry collector, etc.)
docker compose -f infra/docker/compose.yml --profile observability up --watch
```

### Local development without Docker

```bash
pnpm install
pnpm dev
```

## Project Structure

```
apps/
  api/    – Express/Hono API server
  cli/    – CLI tooling
  web/    – Vite + React frontend
packages/
  ai-core/       – AI model wrappers
  ai-pipelines/  – LangChain pipelines (summarize, rewrite, create-prd)
  config/        – Shared configuration
  contracts/     – Shared TypeScript types / Zod schemas
  prompts/       – Prompt templates
infra/
  docker/        – Dockerfiles and Docker Compose configuration
```
