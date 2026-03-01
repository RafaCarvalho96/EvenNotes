# 11 - PRD - Fix: Docker API container crash (tsx MODULE_NOT_FOUND)

## 1. Status

- **Tipo:** Bug fix
- **Prioridade:** P0 – bloqueador de ambiente
- **Relacionado a:** PRD 05 (DevOps/Compose), Backlog A3
- **Data:** 2026-03-01

---

## 2. Problema observado

Ao executar `pnpm docker:up`, o container `api-1` entra em crash-loop imediato com a seguinte mensagem:

```
Error: Cannot find module '/app/apps/api/node_modules/tsx/dist/cli.mjs'
code: 'MODULE_NOT_FOUND'
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL: tsx watch src/index.ts
```

O container sobe, falha no healthcheck e reinicia em loop, impedindo qualquer uso do ambiente de desenvolvimento.

---

## 3. Análise de causa raiz

### 3.1 Conflito de volume no Compose

O `compose.yml` declara um bind mount que cobre **todo o workspace**:

```yaml
volumes:
  - ../../:/app
```

Esse mount **sobrescreve** o diretório `/app` dentro do container — incluindo o `node_modules` que foi instalado pelo Dockerfile durante o build (em ambiente Linux, com a estrutura de virtual store do pnpm).

O `node_modules` do host (Windows) usa paths, symlinks e binários compilados para a plataforma do host. Ao sobrescrever `/app`, o Linux dentro do container tenta resolver `tsx` a partir da estrutura Windows, que é incompatível.

### 3.2 CMD usando `pnpm exec` em vez de `pnpm run`

O `api.Dockerfile` usa:

```dockerfile
CMD ["pnpm", "--filter", "@evennotes/api", "exec", "tsx", "watch", "src/index.ts"]
```

`pnpm exec` resolve o binário dentro do `node_modules/.bin` do pacote filtrado (`/app/apps/api/node_modules/.bin/tsx`). Com o volume sobrescrevendo `/app`, esse caminho não existe ou aponta para um binário inválido do host.

A abordagem correta é usar `pnpm run`, que delega ao script definido no `package.json` do pacote e resolve o binário via shell do próprio pnpm, com resolução de caminhos mais robusta.

---

## 4. Solução

### 4.1 Proteger `node_modules` com volumes anônimos (fix principal)

Adicionar volumes anônimos em `compose.yml` para impedir que o bind mount do workspace sobrescreva os diretórios `node_modules` instalados no build da imagem:

```yaml
volumes:
  - ../../:/app
  - /app/node_modules          # protege root node_modules (pnpm virtual store)
  - /app/apps/api/node_modules # protege node_modules local da api
```

O Docker resolve volumes da seguinte forma: o bind mount (`../../:/app`) é aplicado primeiro, depois os volumes anônimos "protegem" os subdirectórios declarados, mantendo o conteúdo instalado no container.

### 4.2 Corrigir CMD do Dockerfile da API

Substituir `pnpm exec` por `pnpm run` no stage `dev`:

```dockerfile
# Antes (quebrado)
CMD ["pnpm", "--filter", "@evennotes/api", "exec", "tsx", "watch", "src/index.ts"]

# Depois (correto)
CMD ["pnpm", "--filter", "@evennotes/api", "run", "dev"]
```

Isso reutiliza o script `"dev": "tsx watch src/index.ts"` definido em `apps/api/package.json` e delega a resolução de binários ao pnpm, que garante o caminho correto independente de hoisting.

---

## 5. Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `infra/docker/compose.yml` | Adicionar volumes anônimos para `node_modules` no serviço `api` |
| `infra/docker/api.Dockerfile` | Trocar `exec tsx watch ...` por `run dev` no `CMD` do stage `dev` |

---

## 6. Arquivos NÃO afetados

- `apps/api/package.json` — script `dev` já está correto
- `infra/docker/web.Dockerfile` — não apresenta o mesmo problema
- `packages/*` — sem alteração
- Código de aplicação — sem alteração

---

## 7. Critérios de aceite

- [ ] `pnpm docker:up` executa sem crash-loop no container `api-1`
- [ ] Healthcheck `GET /health` responde com sucesso dentro do container
- [ ] Container `web-1` sobe após `api-1` se tornar healthy (depende do `depends_on`)
- [ ] Logs do `api-1` mostram saída do Fastify/servidor iniciando (sem `MODULE_NOT_FOUND`)
- [ ] Alterações em `apps/api/src` continuam sendo sincronizadas via `docker compose watch`
- [ ] Rebuild ocorre ao alterar `apps/api/package.json` ou `pnpm-lock.yaml`
- [ ] O fix é reproduzível em máquina limpa (sem `node_modules` no host)

---

## 8. Riscos e observações

| Risco | Mitigação |
|---|---|
| Outros workspaces do pnpm também podem ter seus `node_modules` sobrescritos | Avaliar se `apps/api/node_modules` é suficiente ou se outros `packages/*/node_modules` também precisam de volume anônimo |
| O volume anônimo persiste entre rebuilds, podendo conter dependências desatualizadas | Rodar `docker compose down -v` antes de `up` ao atualizar `pnpm-lock.yaml` |
| `web.Dockerfile` pode sofrer problema similar no futuro | Monitorar e aplicar o mesmo padrão de volume se necessário |

---

## 9. Como testar após o fix

```bash
# Remover containers e volumes antigos
docker compose -f infra/docker/compose.yml down -v

# Subir novamente com watch
pnpm docker:up

# Verificar saúde do container
docker inspect docker-api-1 --format='{{.State.Health.Status}}'

# Testar healthcheck manualmente
curl http://localhost:3001/health
```

---

## 10. Decisões descartadas

| Alternativa | Motivo da rejeição |
|---|---|
| Instalar `tsx` como `dependency` em vez de `devDependency` | Não resolve o conflito de volume; apenas mascara o problema |
| Remover o bind mount e usar apenas COPY | Perde hot-reload em desenvolvimento, contrário à estratégia do PRD 05 |
| Usar `--shamefully-hoist` no `.npmrc` | Hoist não corrige cross-platform; não resolve a sobrescrita pelo bind mount |
| Usar `npx tsx` ou path absoluto no CMD | Frágil e dependente da estrutura interna do pnpm store |
