# 03 - PRD - Backend API mínima

## 1. Objetivo

Definir o serviço Node.js/TypeScript que expõe a API mínima do EvenNotes, orquestra filesystem, execuções de pipeline e streaming.

## 2. Decisão técnica

### Stack recomendada
- Node.js 24 LTS
- TypeScript
- Fastify
- validação com schema/Zod
- SSE ou WebSocket para streaming
- pino para logging
- adaptadores por porta

## 3. Justificativa

Fastify entrega boa DX, performance e integração clara com TypeScript e schema.
Para este produto, ele atende melhor que uma camada mais pesada.

## 4. Responsabilidades do backend

- listar workspace e arquivos;
- ler/salvar arquivos Markdown;
- expor endpoint de execução de comando/pipeline;
- fazer streaming de eventos;
- registrar logs de execução;
- encapsular providers de IA;
- coordenar engine de pipelines.

## 5. Escopo MVP

### In scope
- API local HTTP;
- endpoints REST mínimos;
- streaming de execução;
- storage local;
- histórico simples de runs;
- healthcheck;
- config por ambiente.

### Out of scope
- autenticação complexa;
- RBAC;
- multi-tenant;
- fila distribuída;
- cache distribuído.

## 6. Endpoints sugeridos

### Workspace
- `GET /health`
- `GET /api/workspace/tree`
- `GET /api/files/content?path=...`
- `PUT /api/files/content`

### Commands / Runs
- `POST /api/commands/run`
- `GET /api/runs/:id`
- `GET /api/runs/:id/events`

### Config
- `GET /api/config/providers`
- `GET /api/config/pipelines`

## 7. Contrato de execução

Payload sugerido para `POST /api/commands/run`:

```json
{
  "command": "rewrite",
  "target": {
    "type": "selection",
    "path": "docs/example.md",
    "selection": {
      "start": 120,
      "end": 410
    }
  },
  "params": {
    "tone": "technical",
    "preserveHeadings": true
  },
  "provider": "openai"
}
```

Resposta inicial:
- `runId`
- `status`
- `streamUrl`

## 8. Eventos de execução

Tipos sugeridos:
- `run.created`
- `run.validating`
- `run.context_collected`
- `run.model_started`
- `run.token_stream`
- `run.tool_called`
- `run.completed`
- `run.failed`

## 9. Módulos internos sugeridos

- `config`
- `http`
- `workspace`
- `files`
- `commands`
- `runs`
- `pipelines`
- `llm`
- `telemetry`

## 10. Arquitetura interna

### Camadas
- interface/http
- application/use-cases
- domain
- infrastructure/adapters

### Regras
- domínio não depende de Fastify;
- provider LLM implementa interface;
- filesystem fica encapsulado;
- pipeline engine é invocada por caso de uso.

## 11. Requisitos não funcionais

- erros tipados;
- logs estruturados;
- timeout configurável por execução;
- limites de tamanho de arquivo e contexto;
- capacidade de cancelar run futuramente;
- baixo acoplamento.

## 12. Critérios de aceite

- listar árvore de arquivos;
- ler e salvar arquivo;
- disparar run com retorno de `runId`;
- transmitir progresso e resultado;
- lidar com falha de provider sem crash do processo;
- manter organização de código por módulos claros.
