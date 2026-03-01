# 09 - Stack Decision Record

## Decisões principais

### 1. Node.js 24 LTS
Escolha por estabilidade atual de LTS e alinhamento com tooling moderno.

### 2. TypeScript end-to-end
Escolha por segurança de tipos, contratos compartilhados e DX.

### 3. pnpm workspace + Turborepo + TS project references
Escolha por organização modular, builds incrementais e compartilhamento limpo.

### 4. React + Vite
Escolha por rapidez de setup, build e DX moderna.

### 5. CodeMirror 6
Escolha por extensibilidade real de editor e melhor adequação que soluções muito opinionated.

### 6. react-markdown + remark/rehype
Escolha por renderização segura e pipeline clara de transformação Markdown.

### 7. Fastify
Escolha por API mínima, boa performance e bom encaixe com TS/schema.

### 8. Commander.js
Escolha por maturidade e simplicidade em CLI Node.

### 9. LangChain v1 + LangGraph
Escolha por equilibrar produtividade inicial com base para workflows stateful e duráveis.

### 10. Docker Compose
Escolha por simplicidade de ambiente local e boa experiência de onboarding.

## Alternativas consideradas

### Monorepo vs multi-repo
Escolhido monorepo pelo compartilhamento forte de contratos e packages.

### Express vs Fastify
Fastify vence por typing e estrutura melhor para API mínima com schema.

### Editor pronto vs CodeMirror 6
CodeMirror 6 vence por controle fino e menor lock-in.

### LangChain apenas vs LangChain + LangGraph
Somente LangChain atende MVP simples, mas LangGraph melhora a trilha de evolução para workflows duráveis.

## Decisões de postergação

- banco relacional dedicado;
- colaboração em tempo real;
- plugin system;
- RAG avançado;
- auth completa.
