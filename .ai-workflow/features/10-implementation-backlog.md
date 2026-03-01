# 10 - Backlog executável inicial

## Epic A - Fundação do repositório

### Tarefa A1
Criar monorepo com `apps/`, `packages/`, `infra/`, `docs/`.

Aceite:
- estrutura existe;
- workspace instala;
- build raiz roda.

### Tarefa A2
Configurar pnpm workspace, turbo e tsconfig base.

Aceite:
- `pnpm install` funciona;
- `turbo run build` funciona;
- packages compartilham tipos.

### Tarefa A3
Criar compose com `web` e `api`.

Aceite:
- stack sobe;
- portas documentadas.

## Epic B - Editor

### Tarefa B1
Listar arquivos do workspace no frontend.

Aceite:
- árvore aparece;
- somente paths válidos são mostrados.

### Tarefa B2
Abrir e editar `.md`.

Aceite:
- conteúdo carrega;
- edição salva.

### Tarefa B3
Renderizar preview.

Aceite:
- headings, listas, tabelas e code blocks renderizam.

## Epic C - API

### Tarefa C1
Criar healthcheck e config bootstrap.

Aceite:
- `GET /health` responde OK.

### Tarefa C2
Criar read/write file API.

Aceite:
- leitura e escrita funcionam no workspace permitido.

### Tarefa C3
Criar contrato compartilhado para arquivos.

Aceite:
- web e api usam os mesmos tipos.

## Epic D - CLI

### Tarefa D1
Criar binário `evennotes`.

Aceite:
- `evennotes --help` funciona.

### Tarefa D2
Implementar `health` e `workspace tree`.

Aceite:
- comandos retornam dados esperados.

## Epic E - IA

### Tarefa E1
Criar adapter de provider.

Aceite:
- interface única definida;
- um provider funcional conectado.

### Tarefa E2
Criar pipeline `summarize`.

Aceite:
- comando gera resumo de um `.md`.

### Tarefa E3
Criar pipeline `rewrite`.

Aceite:
- comando gera versão reescrita.

### Tarefa E4
Criar pipeline `create-prd`.

Aceite:
- comando gera documento inicial estruturado.

## Epic F - UX de execução

### Tarefa F1
Exibir status de run no frontend.

Aceite:
- usuário vê progresso.

### Tarefa F2
Exibir resultado e permitir aplicar.

Aceite:
- resultado pode ser copiado ou inserido.

## Epic G - Qualidade

### Tarefa G1
Adicionar lint, typecheck e testes básicos.

Aceite:
- pipeline local de qualidade passa.

### Tarefa G2
Adicionar logs com `runId`.

Aceite:
- execução pode ser rastreada.

### Tarefa G3
Sanitizar preview e validar path.

Aceite:
- casos inseguros falham corretamente.
