# 12 - Fix: Editor exibe erro de JSON parse ao carregar arquivo

## 1. Contexto

Ao selecionar um arquivo na sidebar da aplicação web, o editor exibe a mensagem:

```
⚠ Erro ao carregar arquivo: Unexpected token '<', "<!doctype "... is not valid JSON
```

Esse erro ocorre porque o hook `useFileLoader` faz um `fetch` relativo para `/api/files/content?path=...`, mas o servidor Vite (porta `5173`) não possui proxy configurado para `/api`. Sem proxy, o Vite responde com o SPA fallback (`index.html`, `Content-Type: text/html`) com status `200 OK`. O hook interpreta `res.ok === true` como sucesso e chama `res.json()`, que falha ao tentar parsear HTML como JSON.

O erro bruto do engine JavaScript vaza diretamente para a UI, tornando a mensagem incompreensível para o usuário.

---

## 2. Objetivo

- Garantir que requisições `/api/*` do dev server (Vite) sejam encaminhadas para `http://localhost:3001` (Fastify).
- Proteger `useFileLoader` contra respostas não-JSON (`res.headers['content-type']` não contém `application/json`).
- Exibir mensagem tratada e acionável ao usuário quando a API não estiver disponível ou retornar resposta inesperada.

---

## 3. Usuários/atores

- Desenvolvedor usando `pnpm dev` localmente (Vite + Fastify em processos separados).
- Usuário final via Docker Compose (`web` + `api` como serviços separados em rede interna).

---

## 4. Escopo

### In

- Configurar proxy `/api` no `vite.config.ts`.
- Adicionar validação de `Content-Type` em `useFileLoader.ts` antes de chamar `res.json()`.
- Normalizar mensagens de erro de parse/rede para texto amigável em `useFileLoader.ts`.
- Atualizar a mensagem de erro em `App.tsx` para ser genérica e não vazar detalhes de implementação.

### Out

- Não alterar lógica de roteamento do Fastify.
- Não alterar o contrato do endpoint `GET /api/files/content`.
- Não alterar outros hooks ou componentes não afetados.

---

## 5. Fluxos principais

### Fluxo A — Dev local sem proxy (bug atual)

1. Usuário seleciona arquivo na sidebar.
2. `useFileLoader` chama `fetch('/api/files/content?path=...')`.
3. Vite intercepta, devolve `index.html` com `200 OK` e `Content-Type: text/html`.
4. `res.ok === true` → código segue caminho de sucesso.
5. `res.json()` falha com `SyntaxError: Unexpected token '<'`.
6. Catch captura e seta `status: 'error'` com a mensagem bruta do SyntaxError.
7. UI exibe `⚠ Erro ao carregar arquivo: Unexpected token '<'...`.

### Fluxo B — Dev local com proxy corrigido

1. Usuário seleciona arquivo na sidebar.
2. `useFileLoader` chama `fetch('/api/files/content?path=...')`.
3. Vite encaminha via proxy para `http://localhost:3001/api/files/content?path=...`.
4. Fastify responde `200 OK` com `{ path, content }` em JSON.
5. `res.ok === true` e `Content-Type: application/json` → `res.json()` sucede.
6. Editor exibe o conteúdo do arquivo.

### Fluxo C — API fora do ar (qualquer ambiente)

1. `fetch` rejeita com `TypeError: fetch failed` ou retorna resposta HTML de erro.
2. Guard de content-type ou catch de rede normaliza para mensagem amigável.
3. UI exibe `⚠ Não foi possível carregar o arquivo. Verifique se a API está em execução.`

---

## 6. Requisitos funcionais

- RF-01: O Vite dev server deve fazer proxy de todas as requisições `/api/*` para `http://localhost:3001`.
- RF-02: `useFileLoader` deve verificar se `Content-Type` da resposta contém `application/json` **antes** de chamar `res.json()`.
- RF-03: Quando `Content-Type` não for JSON e `res.ok === true`, o hook deve lançar um erro interno com mensagem `"Resposta inesperada do servidor (não-JSON)"`.
- RF-04: Erros de rede (`TypeError`) e erros de parse (`SyntaxError`) devem ser mapeados para a mensagem `"Não foi possível carregar o arquivo. Verifique se a API está em execução."` antes de serem expostos na UI.
- RF-05: Erros HTTP com corpo JSON (`res.ok === false`) devem continuar usando `body.error` ou `HTTP <status>` como mensagem.

---

## 7. Requisitos não funcionais

- RNF-01: A correção do proxy não deve afetar o build de produção (o proxy Vite só é ativo em modo de dev).
- RNF-02: O guard de content-type não deve introduzir overhead perceptível (verificação de header é O(1)).
- RNF-03: Nenhum detalhe interno (stack trace, mensagem de SyntaxError do engine) deve vazar para a UI.
- RNF-04: O comportamento de `AbortController` (cancelamento de requisição em voo) deve ser preservado.

---

## 8. Modelo de dados e contratos

### Contrato esperado do endpoint (sem mudança)

```
GET /api/files/content?path=<relative-path>

200 OK
Content-Type: application/json
{ "path": "...", "content": "..." }

400 Bad Request
{ "error": "Query parameter \"path\" is required..." }

403 Forbidden
{ "error": "..." }

404 Not Found
{ "error": "File not found" }
```

### Tipos internos do hook (sem mudança de interface pública)

```typescript
// FileLoaderState — sem alteração
type FileLoaderState = FileLoaderIdle | FileLoaderLoading | FileLoaderSuccess | FileLoaderError
```

---

## 9. Dependências

| Item | Tipo | Observação |
|---|---|---|
| `apps/web/vite.config.ts` | Arquivo a editar | Adicionar `server.proxy` |
| `apps/web/src/hooks/useFileLoader.ts` | Arquivo a editar | Guard de content-type + normalização de erro |
| `apps/web/src/App.tsx` | Opcional | Mensagem genérica já funciona se o hook normalizar |
| `@vitejs/plugin-react` | Dependência existente | Nenhuma mudança de versão necessária |
| `PORT_API=3001` | Convenção do projeto | Confirmado em `config.ts` e `compose.yml` |

---

## 10. Critérios de aceite

- CA-01: Ao rodar `pnpm dev` (Vite + Fastify), selecionar um arquivo na sidebar carrega o conteúdo no editor sem erro.
- CA-02: Ao parar o servidor da API e selecionar um arquivo, a UI exibe `⚠ Não foi possível carregar o arquivo. Verifique se a API está em execução.` (e não o SyntaxError bruto).
- CA-03: `vite.config.ts` contém `server.proxy` com regra `/api` apontando para `http://localhost:3001`.
- CA-04: `useFileLoader.ts` verifica `Content-Type` e lança erro amigável quando a resposta não é JSON.
- CA-05: `pnpm typecheck` no workspace `web` finaliza sem erros após as mudanças.
- CA-06: O comportamento de cancelamento via `AbortController` permanece funcional (troca rápida de arquivo não causa race condition).

---

## 11. Riscos e trade-offs

| Risco | Impacto | Mitigação |
|---|---|---|
| Proxy Vite não funciona em produção (Docker) | Nulo — em produção o web é servido pelo mesmo host ou por nginx que já roteia `/api` | Documentar que o proxy é exclusivo do dev server |
| URL hardcoded `localhost:3001` no proxy | Quebra se `PORT` for alterada | Ler `process.env.PORT_API` no `vite.config.ts` ou documentar a convenção |
| Guard de content-type bloqueia resposta comprimida com header correto | Improvável — Fastify seta `application/json` corretamente | Testar com `Accept-Encoding` ativo |

---

## 12. Plano de implementação

### Passo 1 — Proxy no Vite (`vite.config.ts`)

```typescript
// apps/web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

### Passo 2 — Guard de Content-Type + normalização de erro (`useFileLoader.ts`)

No bloco `.then(async (res) => { ... })`, após verificar `res.ok`:

```typescript
// Após confirmar res.ok === true:
const contentType = res.headers.get("content-type") ?? "";
if (!contentType.includes("application/json")) {
  throw new Error("Resposta inesperada do servidor (não-JSON)");
}
return res.json() as Promise<{ path: string; content: string }>;
```

No bloco `.catch((err: unknown) => { ... })`, antes de setar o estado de erro:

```typescript
if (err instanceof Error && err.name === "AbortError") return;
const isNetworkOrParse =
  err instanceof TypeError || err instanceof SyntaxError;
const message = isNetworkOrParse
  ? "Não foi possível carregar o arquivo. Verifique se a API está em execução."
  : err instanceof Error
  ? err.message
  : "Erro desconhecido";
setState({ status: "error", message, loadedPath: selectedPath });
```

### Passo 3 — Verificação

```bash
pnpm --filter web typecheck
```

Selecionar arquivo no editor e confirmar CA-01 e CA-02.

---

## Backlog executável

| # | Tarefa | Arquivo | Critério de aceite |
|---|---|---|---|
| T1 | Adicionar `server.proxy` ao `vite.config.ts` | `apps/web/vite.config.ts` | CA-03 |
| T2 | Adicionar guard de content-type em `useFileLoader` | `apps/web/src/hooks/useFileLoader.ts` | CA-04 |
| T3 | Normalizar mensagens de erro de rede/parse em `useFileLoader` | `apps/web/src/hooks/useFileLoader.ts` | CA-02 |
| T4 | Typecheck | workspace `web` | CA-05 |
| T5 | Teste manual: carregar arquivo com API ativa | browser | CA-01 |
| T6 | Teste manual: carregar arquivo com API parada | browser | CA-02 |
