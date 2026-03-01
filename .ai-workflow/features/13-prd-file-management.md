# 13 - PRD - Gerenciamento de Arquivos (criar, renomear, excluir)

## 1. Contexto

O workspace hoje é somente leitura pelo frontend: o usuário pode abrir e editar arquivos existentes, mas não pode criar novos arquivos, renomear nem excluir diretamente pela UI. Isso obriga uso do terminal ou do sistema de arquivos do host para qualquer operação estrutural, quebrando o fluxo local-first.

## 2. Objetivo

Permitir que o usuário gerencie a estrutura de arquivos `.md` do workspace inteiramente pela UI, sem sair do EvenNotes, mantendo as garantias de segurança de path já existentes.

## 3. Usuários/atores

- Escritor/desenvolvedor local que usa o EvenNotes para editar notas e documentos.

## 4. Escopo

### In scope

- Criar novo arquivo `.md` dentro do workspace.
- Renomear arquivo existente.
- Excluir arquivo existente (com confirmação explícita).
- Criar subdiretório ao criar arquivo com path aninhado (ex: `notas/reuniao.md`).
- Atualizar a árvore do workspace após cada operação sem reload manual.

### Out of scope

- Mover arquivo entre diretórios (drag-and-drop).
- Criar diretório vazio (sem arquivo associado).
- Operações em lote (excluir múltiplos de uma vez).
- Desfazer exclusão (lixeira).
- Renomear diretório.

## 5. Fluxos principais

### F1 — Criar arquivo

1. Usuário clica em "Novo arquivo" na sidebar (botão `+`).
2. Um input inline ou modal solicita o nome/path (ex: `notas/reuniao.md`).
3. Frontend valida: extensão `.md` obrigatória, path não vazio.
4. Frontend envia `POST /api/files` com `{ path, content: "" }`.
5. API cria o arquivo (e diretórios intermediários se necessário) dentro do workspace.
6. Frontend recarrega `GET /api/workspace/tree` e seleciona o novo arquivo automaticamente.

### F2 — Renomear arquivo

1. Usuário ativa rename no item da sidebar (botão de edição ou duplo-clique no nome).
2. Input inline substitui o nome exibido; tecla `Enter` confirma, `Escape` cancela.
3. Frontend valida: novo nome com extensão `.md`, diferente do atual.
4. Frontend envia `PATCH /api/files/rename` com `{ from, to }`.
5. API renomeia no filesystem (move o arquivo).
6. Frontend recarrega a árvore; se o arquivo renomeado estava aberto no editor, atualiza o path ativo.

### F3 — Excluir arquivo

1. Usuário clica no ícone de lixeira no item da sidebar.
2. UI exibe confirmação (texto simples: "Excluir `<nome>`?") com botões Cancelar / Confirmar.
3. Após confirmação, frontend envia `DELETE /api/files?path=<path>`.
4. API remove o arquivo do filesystem.
5. Frontend recarrega a árvore; se o arquivo excluído estava aberto, limpa o editor.

## 6. Requisitos funcionais

1. `POST /api/files` cria arquivo com conteúdo inicial vazio (ou fornecido), criando diretórios intermediários.
2. `PATCH /api/files/rename` move o arquivo de `from` para `to` dentro do workspace.
3. `DELETE /api/files?path=` remove o arquivo do workspace.
4. Todos os endpoints reusam `resolveWorkspacePath` para garantir que o path fique dentro do `WORKSPACE_ROOT`.
5. Se o path de destino (criar ou renomear) já existir, a API retorna `409 Conflict`.
6. Se o arquivo a excluir ou renomear não existir, a API retorna `404 Not Found`.
7. A sidebar recarrega a árvore automaticamente após qualquer operação bem-sucedida.
8. O editor limpa o estado se o arquivo aberto for excluído.
9. O editor atualiza o `selectedFile` se o arquivo aberto for renomeado.
10. A confirmação de exclusão bloqueia a ação acidental (não pode ser desfeita).

## 7. Requisitos não funcionais

- Nenhuma operação de escrita deve acontecer sem confirmação explícita do usuário (criação de arquivo novo não precisa de confirmação, exclusão sim).
- Path traversal deve ser rejeitado com `403` antes de qualquer operação no filesystem.
- A UI não deve travar durante chamadas de rede; indicar estado de loading no item afetado.
- Mensagens de erro da API devem aparecer no frontend de forma visível (não silenciosos).

## 8. Contratos de API

### `POST /api/files`

```
Body: { path: string, content?: string }
201 Created:  { path: string, createdAt: string }
400 Bad Request: { error: string }
403 Forbidden:   { error: string }  // path traversal
409 Conflict:    { error: string }  // arquivo já existe
```

### `PATCH /api/files/rename`

```
Body: { from: string, to: string }
200 OK:        { from: string, to: string, renamedAt: string }
400 Bad Request: { error: string }
403 Forbidden:   { error: string }
404 Not Found:   { error: string }
409 Conflict:    { error: string }  // destino já existe
```

### `DELETE /api/files`

```
Query: path=<string>
200 OK:        { path: string, deletedAt: string }
403 Forbidden: { error: string }
404 Not Found: { error: string }
```

## 9. Dependências

### Backend
- `apps/api/src/routes/files.ts` — adicionar os três novos handlers.
- `apps/api/src/utils/workspace-boundary.ts` — já existente, reusar sem modificar.
- `node:fs/promises` — `writeFile` com `{ flag: 'wx' }` (falha se existir), `rename`, `unlink`, `mkdir`.

### Frontend
- `apps/web/src/hooks/useWorkspaceTree.ts` — expor função de refresh ou converter para polling/refetch manual.
- `apps/web/src/components/WorkspaceTree.tsx` — adicionar ações por item e botão de novo arquivo.
- `apps/web/src/App.tsx` — reagir ao file excluído/renomeado aberto no editor.

## 10. Critérios de aceite

- [ ] Criar `notas/nova.md` via UI: arquivo aparece na árvore e abre no editor vazio.
- [ ] Tentar criar `../../escape.md`: API retorna `403`, UI exibe erro.
- [ ] Tentar criar arquivo já existente: API retorna `409`, UI exibe erro.
- [ ] Renomear `a.md` para `b.md`: arquivo aparece com novo nome, editor mantém o conteúdo.
- [ ] Renomear arquivo aberto: `selectedFile` no editor atualiza para o novo path.
- [ ] Excluir arquivo sem confirmar (pressionar Escape na modal): nenhuma requisição enviada.
- [ ] Excluir arquivo aberto: editor limpa, sidebar atualiza.
- [ ] Excluir arquivo inexistente (concorrência): API retorna `404`, UI exibe erro sem crash.

## 11. Riscos e trade-offs

- **Volume Docker vazio**: o workspace começa vazio em dev; as operações de criação são o primeiro ponto de entrada de conteúdo real. Sem seed, o usuário precisa criar o primeiro arquivo pela UI — isso é intencional.
- **Rename sem "undo"**: a operação de renomear não tem desfazer. Adiado para versão futura.
- **Race condition na árvore**: se dois clientes estiverem abertos, a árvore pode dessincronizar. Fora de escopo — o produto é local-first com um único usuário.
- **Diretórios órfãos**: ao excluir o último arquivo de um diretório, o diretório permanece no filesystem mas some da árvore (que lista apenas `.md`). Aceito como comportamento esperado.

## 12. Plano de implementação

1. **API** — adicionar `POST /api/files`, `PATCH /api/files/rename`, `DELETE /api/files` em `apps/api/src/routes/files.ts`.
2. **Testes de rota** — cobrir 201, 409, 403, 404 e 200 para cada endpoint em `apps/api/src/__tests__/files.test.ts`.
3. **Hook de refresh** — expor `refetch` em `useWorkspaceTree` ou converter para trigger manual.
4. **WorkspaceTree** — adicionar botão `+` no header da sidebar e ações de rename/delete por item.
5. **App.tsx** — tratar `selectedFile` excluído/renomeado, limpar ou redirecionar.
6. **Validação de nome no frontend** — garantir extensão `.md` antes de enviar.
