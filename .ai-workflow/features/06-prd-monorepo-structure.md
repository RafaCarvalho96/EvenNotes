# 06 - PRD - Monorepo e estrutura de pastas

## 1. Objetivo

Definir a estrutura do repositório para manter o produto organizado, escalável e compatível com desenvolvimento por agente.

## 2. Recomendação

Usar monorepo com:
- pnpm workspaces
- Turborepo
- TypeScript project references

## 3. Justificativa

Esse conjunto favorece:
- compartilhamento de tipos e contratos;
- builds incrementais;
- separação por apps e packages;
- melhor evolução modular.

## 4. Estrutura proposta

```text
evennotes/
  apps/
    web/
    api/
    cli/
  packages/
    ui/
    markdown-core/
    workspace-core/
    contracts/
    config/
    ai-core/
    ai-pipelines/
    prompts/
    observability/
    test-utils/
  infra/
    docker/
  docs/
    prd/
    adr/
  scripts/
  .github/
  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
```

## 5. Responsabilidade de cada área

### apps/web
UI React, editor, preview, painéis de execução.

### apps/api
API mínima, filesystem, orchestration HTTP.

### apps/cli
comandos terminal e integração com backend/runner.

### packages/contracts
tipos compartilhados entre web, api e cli.

### packages/ai-core
abstrações de provider, run context e engine base.

### packages/ai-pipelines
pipelines concretas.

### packages/prompts
templates e assets textuais versionados.

### packages/markdown-core
serviços utilitários de parse/render/transformação.

### packages/workspace-core
listagem de arquivos, regras de path, filtros e segurança.

### packages/observability
logging, tracing, helpers.

## 6. Convenções

- imports por alias
- cada package com `src/`
- testes próximos do código ou em `tests/`
- docs do produto em `docs/`
- ADRs separados das PRDs

## 7. Critérios de separação entre packages

Criar package separada quando houver:
- contrato compartilhado;
- responsabilidade reutilizável;
- fronteira de dependência clara;
- necessidade de testes independentes.

Não criar package para tudo. Evitar granularidade artificial.

## 8. Critérios de aceite

- dependências entre apps e packages são claras;
- tipos compartilhados não ficam duplicados;
- o repositório permite execução incremental;
- um agente consegue atuar em uma área sem carregar todo o contexto.
