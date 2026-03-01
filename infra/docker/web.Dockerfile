# syntax=docker/dockerfile:1
# EvenNotes – Web multi-stage Dockerfile
# Stages: base → dev | build → prod

# ─────────────────────────────────────────────────────────────
# Stage: base
#   Installs pnpm and all workspace dependencies with BuildKit
#   cache so that the layer is reused across builds.
# ─────────────────────────────────────────────────────────────
FROM node:24-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy only the workspace manifests first (maximises cache hits)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
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
#   Vite dev server bound to 0.0.0.0 so it is reachable from
#   the host; source code is volume-mounted at runtime.
# ─────────────────────────────────────────────────────────────
FROM base AS dev

COPY . .

EXPOSE 5173

CMD ["pnpm", "--filter", "@evennotes/web", "dev", "--", "--host", "0.0.0.0"]

# ─────────────────────────────────────────────────────────────
# Stage: build
#   Compiles the Vite/React app to static assets.
# ─────────────────────────────────────────────────────────────
FROM base AS build

COPY . .

RUN pnpm --filter @evennotes/web build

# ─────────────────────────────────────────────────────────────
# Stage: prod
#   Lightweight nginx image that serves the compiled assets.
# ─────────────────────────────────────────────────────────────
FROM nginx:alpine AS prod

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
