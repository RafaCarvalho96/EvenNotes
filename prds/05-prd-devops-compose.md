# 05 - PRD - DevOps e Docker Compose

## 1. Objetivo

Definir o ambiente local e o padrão de execução do EvenNotes usando Docker Compose.

## 2. Decisão técnica

Usar um único `compose.yml` com profiles para serviços opcionais e watch para desenvolvimento.

## 3. Serviços iniciais sugeridos

### Obrigatórios
- `web`
- `api`

### Opcionais por profile
- `langsmith-proxy` ou integrações auxiliares
- `db` (se SQLite não for suficiente no host)
- `otel-collector` no futuro

## 4. Benefícios do Compose nesse projeto

- onboarding simples;
- ambiente reproduzível;
- isolamento de runtime;
- padronização de portas, volumes e envs;
- suporte a perfis de execução.

## 5. Estratégia de imagens

- Dockerfiles separados por app
- multi-stage build
- imagem dev e imagem prod
- cache inteligente de dependências pnpm

## 6. Volumes

- código fonte montado em dev
- volume para `node_modules` quando necessário
- volume para dados locais e histórico de runs

## 7. Configuração de ambiente

Arquivos sugeridos:
- `.env.example`
- `.env.local`
- `.env.docker`

Variáveis iniciais:
- `PORT_API`
- `PORT_WEB`
- `WORKSPACE_ROOT`
- `LOG_LEVEL`
- `OPENAI_API_KEY` ou provider equivalente
- `LANGSMITH_API_KEY` opcional
- `LANGSMITH_TRACING` opcional

## 8. Estratégia de perfis

- default: `web`, `api`
- `observability`: serviços extras
- `debug`: recursos extras de inspeção

## 9. Estratégia de watch

Usar `docker compose up --watch` ou `docker compose watch` para:
- rebuild seletivo;
- sync de arquivos;
- DX melhor em dev.

## 10. Estrutura sugerida

- `infra/docker/compose.yml`
- `infra/docker/web.Dockerfile`
- `infra/docker/api.Dockerfile`
- `infra/docker/.dockerignore`

## 11. Requisitos não funcionais

- stack deve subir com poucos comandos;
- deve existir healthcheck;
- deve ser possível resetar ambiente facilmente;
- logs devem ser legíveis por serviço.

## 12. Critérios de aceite

- `docker compose up` sobe o ambiente local;
- `docker compose --profile observability up` adiciona serviços opcionais;
- alterações de código em dev têm ciclo razoável de feedback;
- documentação de bootstrap é clara.
