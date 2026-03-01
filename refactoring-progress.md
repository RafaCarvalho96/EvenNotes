# Refactoring Progress

## Status geral

| US | Título | Status |
|----|--------|--------|
| US-001 | Criar constants.ts com MAX_CONTENT_LENGTH | ✅ Concluído |
| US-002 | Criar base-pipeline.ts com runPipeline | ✅ Concluído |
| US-003 | Refatorar summarize.ts | ✅ Concluído |
| US-004 | Refatorar rewrite.ts | ✅ Concluído |
| US-005 | Refatorar create-prd.ts | ✅ Concluído |
| US-006 | Remover getPipelineTimeout/getMaxRetries de resilience.ts | ✅ Concluído |
| US-007 | Substituir console.info por logger em tracing.ts | ✅ Concluído |
| US-008 | Extrair executeCommand de commandsRoute | ✅ Concluído |
| US-009 | Centralizar guard WORKSPACE_ROOT em filesRoute | ✅ Concluído |
| US-010 | Extrair useCommandRun de RunPanel | ✅ Concluído |
| US-011 | Extrair useEditorState de App.tsx | ✅ Concluído |
| US-012 | Extrair useRunState de App.tsx | ✅ Concluído |

**Todas as 12 User Stories concluídas com sucesso.**

---

## US-001 ✅ — Criar constants.ts com MAX_CONTENT_LENGTH

**O que foi feito:**
- Criado `packages/ai-pipelines/src/constants.ts` exportando `MAX_CONTENT_LENGTH = 8000`
- Removida declaração local em `summarize.ts`, `rewrite.ts` e `create-prd.ts`
- Adicionado `import { MAX_CONTENT_LENGTH } from './constants.js'` nos três arquivos
- Typecheck: passou

---

## US-002 ✅ — Criar base-pipeline.ts com runPipeline

**O que foi feito:**
- Criado `packages/ai-pipelines/src/base-pipeline.ts` exportando `runPipeline(input, buildPromptFn, pipelineName, emptyContentError)`
- Stages 1 (validação), 2 (truncamento), 4 (invocação com withTimeout+withRetry), 5 (log+trace) centralizados
- Stage 3 delegado ao `buildPromptFn`
- Nenhum arquivo existente modificado
- Typecheck: passou

---

## US-003 ✅ — Refatorar summarize.ts

**O que foi feito:**
- `summarize.ts` refatorado para 17 linhas usando `runPipeline`
- Apenas stage 3 (buildPrompt) + chamada ao `runPipeline` permanecem
- Typecheck: passou

---

## US-004 ✅ — Refatorar rewrite.ts

**O que foi feito:**
- `rewrite.ts` refatorado para 16 linhas usando `runPipeline`
- `DEFAULT_INSTRUCTION` e resolução do instruction preservados; resto delegado ao `runPipeline`
- Typecheck: passou

---

## US-005 ✅ — Refatorar create-prd.ts

**O que foi feito:**
- `create-prd.ts` refatorado para 11 linhas usando `runPipeline`
- Parâmetro `context` (nome diferente para o mesmo `input.content`) preservado no `buildPromptFn`
- Typecheck: passou; 8 testes: passaram

---

## US-006 ✅ — Remover getPipelineTimeout e getMaxRetries de resilience.ts

**O que foi feito:**
- `getPipelineTimeout()` e `getMaxRetries()` deletados de `resilience.ts`
- Bloco `// ─── Config ───` removido; `resilience.ts` agora sem `process.env`
- `base-pipeline.ts` lê `process.env['PIPELINE_TIMEOUT_MS']` e `process.env['PIPELINE_MAX_RETRIES']` diretamente
- Typecheck: passou; 8 testes: passaram

---

## US-007 ✅ — Substituir console.info por logger em tracing.ts

**O que foi feito:**
- `import { createLogger } from '@evennotes/observability'` adicionado a `tracing.ts`
- `const logger = createLogger('tracing')` criado
- Dois `console.info(JSON.stringify({...}))` substituídos por `logger.info(msg, data)`
- Nenhum `console.info` restante
- Typecheck: passou

---

## US-008 ✅ — Extrair executeCommand de commandsRoute

**O que foi feito:**
- Criado `apps/api/src/use-cases/execute-command.ts` exportando `executeCommand(payload, runId, workspaceRoot)`
- `executeCommand` contém leitura de arquivo, seleção de pipeline, execução, emissão SSE e tratamento de erro
- Early returns para pipeline-not-found e file-not-found; catch final único
- `commands.ts` POST handler: apenas valida, cria run record e chama `void executeCommand(..., config.WORKSPACE_ROOT)`
- Typecheck: passou; 22 testes: passaram

---

## US-009 ✅ — Centralizar guard WORKSPACE_ROOT em filesRoute

**O que foi feito:**
- `workspaceRoot` lido do `config` singleton uma vez no início do plugin
- `preHandler` hook registrado centraliza o guard (único lugar)
- Todos os 5 handlers (GET, PUT, POST, PATCH, DELETE) removeram `process.env.WORKSPACE_ROOT` e seus guards individuais
- Typecheck: passou; 22 testes: passaram

---

## US-010 ✅ — Extrair useCommandRun de RunPanel

**O que foi feito:**
- Criado `apps/web/src/hooks/useCommandRun.ts` com `useCommandRun(command, target, context, onResult?)`
- Retorna `{ status, output, errorMessage, cancel }`
- `RunPanel.tsx` sem fetch, EventSource ou useEffect com lógica de rede
- `RunPanel` renderiza exclusivamente com base nos valores do hook
- Typecheck: passou

---

## US-011 ✅ — Extrair useEditorState de App.tsx

**O que foi feito:**
- Criado `apps/web/src/hooks/useEditorState.ts` com `useEditorState()`
- Encapsula: `selectedFile`, `content`, `isDirty`, `debouncedContent`, `editorRef`, `fileLoader`, `saveStatus` e o `useEffect` de sincronização
- `App.tsx` usa o hook ao invés de declarar esses estados diretamente
- Typecheck: passou

---

## US-012 ✅ — Extrair useRunState de App.tsx

**O que foi feito:**
- Criado `apps/web/src/hooks/useRunState.ts` com `useRunState(editorRef, setContent, setIsDirty)`
- Retorna: `appMode`, `setAppMode`, `pendingRun`, `runResult`, `handlePaletteExecute`, `handleRunResult`, `handleReplaceSelection`, `handleAppend`, `handleSaveAs`
- `App.tsx` com exatamente 2 `useState` próprios (`selectedText` e `isPaletteOpen`)
- `App.tsx` responsável apenas por composição de layout
- Typecheck: passou
