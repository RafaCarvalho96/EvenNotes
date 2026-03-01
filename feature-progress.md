# Feature Progress — File Management

## Status final: COMPLETO ✅
- 9/9 User Stories implementadas
- 22 testes passando (API)
- Typecheck web e api: sem erros


## US-001: POST /api/files ✅
- Adicionado endpoint `POST /api/files` em `apps/api/src/routes/files.ts`
- Schema `postBodySchema` com `path` (required) e `content` (optional, default '')
- Validação: path vazio → 400, path sem `.md` → 400
- `resolveWorkspacePath` → 403 em path traversal
- `fs.mkdir` recursive para diretórios intermediários
- `fs.writeFile` com flag `'wx'` → 409 se arquivo já existir
- Retorna 201 com `{ path, createdAt }`
- Typecheck passou ✅

## US-002: PATCH /api/files/rename ✅
- Adicionado endpoint `PATCH /api/files/rename` em `apps/api/src/routes/files.ts`
- Schema `renameBodySchema` com `from` e `to` (ambos required, min 1)
- 400 se from ou to vazios
- 403 em path traversal para ambos os paths
- `fs.access(resolvedTo)` → 409 se destino já existir
- `fs.rename(resolvedFrom, resolvedTo)` → 404 se origem não existir (ENOENT)
- Retorna 200 com `{ from, to, renamedAt }`
- Typecheck passou ✅
## US-003: DELETE /api/files ✅
- Adicionado endpoint `DELETE /api/files` em `apps/api/src/routes/files.ts`
- Query param `path` obrigatório → 400 se ausente/vazio
- `resolveWorkspacePath` → 403 em path traversal
- `fs.unlink(resolvedPath)` → 404 se arquivo não existir (ENOENT)
- Retorna 200 com `{ path, deletedAt }`
- Typecheck passou ✅
## US-004: Testes para endpoints de gerenciamento ✅
- 22 testes passando em `apps/api/src/__tests__/files.test.ts`
- POST /api/files: 201, 400 (sem .md), 400 (path vazio), 403 (traversal), 409 (já existe)
- PATCH /api/files/rename: 200, 400, 403 (from/to traversal), 404 (origem), 409 (destino)
- DELETE /api/files: 200, 403 (traversal), 404 (não existe)
- Typecheck passou ✅
## US-005: refetch() no useWorkspaceTree ✅
- Reestruturado `apps/web/src/hooks/useWorkspaceTree.ts`
- `fetchTree` como `useCallback` com flag `cancelled` para evitar race conditions
- `refetch()` exposto via `useCallback`
- Retorno `{ ...state, refetch }` mantém compatibilidade com App.tsx
- Typecheck passou ✅
## US-006: Botão + no header da sidebar ✅
- Prop `onCreateFile` adicionada ao WorkspaceTree
- Header com botão `+` e input inline condicional
- Validação `.md`, Enter submete, Escape cancela
- Erro visível em 409/403
- App.tsx: POST /api/files → refetch() → setSelectedFile
- CSS adicionado para todos os novos elementos
- Typecheck passou ✅
## US-007: Rename inline por item na sidebar ✅
- Componente `FileItem` com estado local de rename
- Botão lápis (PencilIcon SVG) visível no hover + duplo-clique no nome
- Enter valida `.md` e `to !== from`, chama `onRenameFile(from, to)`
- Escape cancela sem enviar requisição
- Erro visível em 404/409
- App.tsx: PATCH /api/files/rename → refetch() → atualiza selectedFile se renomeado
- CSS adicionado para botão lápis e input inline
- Typecheck passou ✅
## US-008: Delete com confirmação por item na sidebar ✅
- TrashIcon SVG adicionado ao FileItem
- Estados `isConfirmingDelete` e `deleteError` no FileItem
- useEffect escuta Escape para fechar diálogo
- Diálogo inline: "Excluir <nome>?" com botões Cancelar/Confirmar
- Confirmar → DELETE /api/files?path= → refetch() → limpa selectedFile se era o arquivo
- CSS: botão lixeira visível no hover + diálogo inline estilizado
- App.tsx: onDeleteFile prop adicionada
- Typecheck passou ✅
## US-009: App.tsx trata arquivo excluído/renomeado ✅
- `onDeleteFile`: ao excluir arquivo aberto → `setSelectedFile(undefined)` + `setContent("")` + `setIsDirty(false)`
- `onRenameFile`: `setSelectedFile(to)` já dispara useFileLoader que recarrega do servidor
- Editor não exibe conteúdo residual após exclusão
- Typecheck passou ✅
