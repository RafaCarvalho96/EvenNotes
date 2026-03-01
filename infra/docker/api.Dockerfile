# syntax=docker/dockerfile:1
# EvenNotes – API multi-stage Dockerfile
# Stages: base → dev | prod

ARG NODE_ENV=production

# ─────────────────────────────────────────────────────────────
# Stage: base
#   Installs pnpm and all workspace dependencies with BuildKit
#   cache so that layer is reused across builds.
# ─────────────────────────────────────────────────────────────
FROM node:24-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy only the workspace manifests first (maximises cache hits)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/cli/package.json ./apps/cli/package.json
COPY packages/ai-core/package.json ./packages/ai-core/package.json
COPY packages/ai-pipelines/package.json ./packages/ai-pipelines/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/markdown-core/package.json ./packages/markdown-core/package.json
COPY packages/observability/package.json ./packages/observability/package.json
COPY packages/prompts/package.json ./packages/prompts/package.json
COPY packages/test-utils/package.json ./packages/test-utils/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/workspace-core/package.json ./packages/workspace-core/package.json

# Install all dependencies with a BuildKit cache mount for the pnpm store
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ─────────────────────────────────────────────────────────────
# Stage: dev
#   Hot-reload via tsx watch; source code is volume-mounted at
#   runtime, so the COPY here is a convenience fallback.
# ─────────────────────────────────────────────────────────────
FROM base AS dev

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

COPY . .

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=30s \
    CMD wget -qO- http://127.0.0.1:3001/health || exit 1

CMD ["pnpm", "--filter", "@evennotes/api", "run", "dev"]

# ─────────────────────────────────────────────────────────────
# Stage: prod
#   Compiles TypeScript to JS, then runs the compiled output.
# ─────────────────────────────────────────────────────────────
FROM base AS prod

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY . .

RUN pnpm build --filter @evennotes/api

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/index.js"]
