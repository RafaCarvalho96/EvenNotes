# 14 - PRD - Refactoring de Qualidade de Código

## 1. Contexto

Uma análise do código atual identificou violações reais e recorrentes de princípios como DRY, SRP, KISS e early return. Os problemas não são teóricos: existem duplicações concretas linha a linha, componentes com múltiplas responsabilidades e leituras paralelas de configuração que ignoram o singleton tipado já existente. Esta PRD documenta cada problema com a localização exata no código, a regra violada e o refactoring esperado.

Nenhum comportamento externo deve mudar. Todos os endpoints, contratos e fluxos permanecem idênticos.

## 2. Objetivo

Eliminar duplicação de código, reduzir acoplamento e clarificar responsabilidades em cada camada, sem alterar nenhum contrato público de API ou comportamento observável.

## 3. Escopo

### In scope

- Extração de `BasePipeline` para eliminar triplicação nos pipelines de IA.
- Extração de use-case `executeCommand` de dentro de `commandsRoute`.
- Centralização do guard de `WORKSPACE_ROOT` nos handlers de arquivo.
- Quebra de `App.tsx` em hooks focados.
- Extração de `useCommandRun` de `RunPanel`.
- Correção de leitura direta de `process.env` em `resilience.ts` que ignora o `config` singleton.
- Substituição de `console.info` manual em `tracing.ts` pelo logger estruturado.
- Consolidação da constante `MAX_CONTENT_LENGTH` duplicada em 3 arquivos.

### Out of scope

- Mudanças de comportamento, performance ou funcionalidade.
- Adição de testes novos além dos ajustes necessários para refatoração.
- Alteração de contratos de API ou tipos em `packages/contracts`.

---

## 4. Problemas identificados

### P1 — Triplicação dos pipelines de IA
**Arquivos:** `packages/ai-pipelines/src/summarize.ts`, `rewrite.ts`, `create-prd.ts`
**Regra violada:** DRY

Os três arquivos são quase idênticos. Estágios 1 (validação de conteúdo vazio), 2 (truncagem), 4 (invocação do model com `withTimeout + withRetry`) e 5 (log + trace de conclusão) são copiados literalmente. A única diferença real entre eles é o estágio 3: qual template de prompt é construído e com quais variáveis.

Além disso, a constante `MAX_CONTENT_LENGTH = 8000` é declarada separadamente nos três arquivos.

**Refactoring esperado:**
- Criar `packages/ai-pipelines/src/base-pipeline.ts` com uma função `runPipeline(input, buildPromptFn)` ou uma classe `BasePipeline` com método `protected buildPrompt(input): string` abstrato.
- Os estágios 1, 2, 4 e 5 ficam em `runPipeline`; cada pipeline filho implementa apenas o estágio 3.
- Mover `MAX_CONTENT_LENGTH` para um arquivo de constantes compartilhado dentro do pacote (ex: `constants.ts`).

```
// Antes: 3 × 75 linhas quase idênticas
// Depois: base-pipeline.ts (~60 linhas) + 3 arquivos de ~10 linhas cada
```

---

### P2 — Lógica de use-case injetada dentro do plugin de rota
**Arquivo:** `apps/api/src/routes/commands.ts`
**Regra violada:** SRP

O handler de `POST /api/commands/run` contém um `void (async () => { ... })()` de ~80 linhas que faz: leitura de arquivo do disco, seleção de pipeline, execução, emissão de eventos em cada estágio e tratamento de erros em três níveis. Tudo isso está dentro do corpo do plugin Fastify.

O route plugin deve apenas validar o request, criar o `runId`, e delegar. A orquestração é responsabilidade de um use-case.

**Refactoring esperado:**
- Criar `apps/api/src/use-cases/execute-command.ts` com uma função `executeCommand(payload, runId, workspaceRoot): Promise<void>`.
- `commandsRoute` chama `void executeCommand(...)` após criar o registro no store.
- A função de use-case tem early returns claros por falha (pipeline não encontrado, arquivo não encontrado) e um único bloco de catch final.

---

### P3 — Guard de `WORKSPACE_ROOT` duplicado em cada handler
**Arquivo:** `apps/api/src/routes/files.ts`
**Regra violada:** DRY

O bloco abaixo aparece duas vezes nos handlers GET e PUT e, com a PRD-13 (criar, renomear, excluir), aparecerá mais três vezes:

```ts
const workspaceRoot = process.env.WORKSPACE_ROOT
if (!workspaceRoot) {
  return reply.code(400).send({ error: 'WORKSPACE_ROOT environment variable is not set' })
}
```

**Refactoring esperado:**
- Registrar um `preHandler` Fastify no escopo do plugin `filesRoute` que atribui `workspaceRoot` ao `request` (ou que rejeita com 400 se ausente).
- Alternativamente, usar o `config` singleton já disponível em `apps/api/src/config.ts` — `WORKSPACE_ROOT` já é validado ali na inicialização; leituras adicionais de `process.env` dentro dos handlers são desnecessárias.

---

### P4 — `resilience.ts` lê `process.env` diretamente, ignorando o `config` singleton
**Arquivo:** `packages/ai-pipelines/src/resilience.ts`
**Regra violada:** DRY / acoplamento de configuração

`getPipelineTimeout()` e `getMaxRetries()` cada um faz `parseInt(process.env['PIPELINE_TIMEOUT_MS'], 10)` na hora da chamada. O `config` singleton em `apps/api/src/config.ts` já lê e valida essas variáveis com Zod, mas `resilience.ts` as lê novamente sem usar o singleton — duplicando a lógica de parsing e ignorando a validação centralizada.

**Refactoring esperado:**
- Como `resilience.ts` está em um pacote compartilhado e não deve depender de `apps/api`, a solução é aceitar os valores como parâmetros nas funções que os utilizam, em vez de ler `process.env` internamente.
- Assinaturas atuais: `withTimeout(fn, ms)` e `withRetry(fn, maxRetries)` — já aceitam os valores por parâmetro.
- Remover `getPipelineTimeout()` e `getMaxRetries()` de `resilience.ts`; o caller (`executeCommand` ou as pipelines) passa os valores vindos do `config`.

---

### P5 — `tracing.ts` usa `console.info` com JSON manual
**Arquivo:** `packages/ai-pipelines/src/tracing.ts`
**Regra violada:** consistência / KISS

`startTrace` e `endTrace` usam `console.info(JSON.stringify({...}))` manualmente enquanto todos os outros módulos do projeto usam `createLogger` de `@evennotes/observability`, que já produz JSON estruturado com nível, timestamp e contexto.

**Refactoring esperado:**
- Substituir as chamadas `console.info` por `logger.info` via `createLogger('tracing')`.

---

### P6 — `App.tsx` é um God Component
**Arquivo:** `apps/web/src/App.tsx`
**Regra violada:** SRP

`App.tsx` acumula atualmente:
- Estado de arquivo selecionado, conteúdo e dirty flag.
- Lógica de autosave (via `useSaveFile`).
- Estado de tema.
- Estado da command palette.
- Estado de execução (`appMode`, `pendingRun`, `runResult`).
- Cinco callbacks inline (`handlePaletteExecute`, `handleRunResult`, `handleReplaceSelection`, `handleAppend`, `handleSaveAs`).
- Renderização condicional do painel direito e do header.

**Refactoring esperado:**
- Extrair `useEditorState()` → encapsula `content`, `isDirty`, `selectedFile`, `debouncedContent` e o `editorRef`.
- Extrair `useRunState()` → encapsula `appMode`, `pendingRun`, `runResult` e os handlers de run.
- `App.tsx` passa a ser responsável apenas pela composição de layout, recebendo tudo pronto dos dois hooks.

---

### P7 — `RunPanel` mistura lógica de rede com renderização
**Arquivo:** `apps/web/src/components/RunPanel.tsx`
**Regra violada:** SRP

O componente `RunPanel` contém dentro de um `useEffect` toda a lógica de: POST para `/api/commands/run`, abertura do `EventSource`, tratamento de três tipos de evento SSE, fechamento do stream e controle de cancelamento. Isso é lógica de data-fetching embutida em um componente de UI.

**Refactoring esperado:**
- Extrair `useCommandRun(command, target, context)` em `apps/web/src/hooks/useCommandRun.ts`.
- O hook retorna `{ status, output, errorMessage, cancel }`.
- `RunPanel` consome o hook e renderiza apenas com base nesses valores, sem nenhuma lógica de rede.

---

## 5. Ordem de execução sugerida

As tarefas são independentes entre si e podem ser feitas em qualquer ordem, mas esta sequência minimiza o risco:

1. **P1** — `BasePipeline` + `MAX_CONTENT_LENGTH` (maior impacto, totalmente no pacote `ai-pipelines`, sem efeito na API).
2. **P4** — Remover `getPipelineTimeout`/`getMaxRetries` de `resilience.ts` (depende de P1 pois os callers mudam).
3. **P5** — `tracing.ts` → usar logger (mudança isolada de uma linha por chamada).
4. **P2** — Extrair `executeCommand` use-case (impacta `commandsRoute`, mas nenhuma API externa muda).
5. **P3** — Guard de `WORKSPACE_ROOT` via `config` ou `preHandler` (impacta `filesRoute`).
6. **P7** — Extrair `useCommandRun` (mudança isolada no frontend, sem impacto na API).
7. **P6** — Quebrar `App.tsx` (maior refactoring no frontend, feito por último).

---

## 6. Requisitos não funcionais

- Nenhum teste existente deve quebrar.
- Nenhum endpoint deve mudar comportamento, status code ou formato de resposta.
- Nenhuma variável de ambiente nova deve ser exigida.
- O `typecheck` (`pnpm typecheck`) deve passar ao final de cada item.

---

## 7. Critérios de aceite

- [ ] `summarize.ts`, `rewrite.ts` e `create-prd.ts` têm menos de 20 linhas cada após a extração de `BasePipeline`.
- [ ] `MAX_CONTENT_LENGTH` existe em exatamente um lugar dentro de `packages/ai-pipelines`.
- [ ] `commandsRoute` não contém lógica de leitura de arquivo nem de execução de pipeline.
- [ ] O bloco guard de `WORKSPACE_ROOT` existe em exatamente um lugar dentro de `filesRoute`.
- [ ] `resilience.ts` não lê `process.env` diretamente.
- [ ] `tracing.ts` não usa `console.info`.
- [ ] `RunPanel.tsx` não contém `fetch`, `EventSource` nem `useEffect` com lógica de rede.
- [ ] `App.tsx` tem no máximo dois `useState` próprios após a extração dos hooks.
- [ ] `pnpm typecheck` e todos os testes passam sem alteração.
