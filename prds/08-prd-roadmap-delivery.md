# 08 - PRD - Roadmap e entrega

## 1. Estratégia

Entregar o produto em milestones pequenas, cada uma testável e demonstrável.

## 2. Milestones

### M0 - Fundação
- monorepo
- pnpm
- turbo
- tsconfig base
- compose
- bootstrap docs

### M1 - Editor local
- web app sobe
- lista arquivos
- abre `.md`
- edita
- autosave
- preview

### M2 - API mínima
- health
- tree
- read/write file
- contratos compartilhados

### M3 - CLI básica
- health
- workspace tree
- run summarize stub

### M4 - Primeira pipeline IA real
- provider adapter
- summarize
- rewrite
- streaming básico

### M5 - UX de execução
- painel de resultados
- aplicar ao documento
- histórico simples

### M6 - Hardening
- testes
- segurança
- logs/tracing
- documentação

## 3. Critério de pronto por milestone

Cada milestone só fecha quando:
- build passa;
- typecheck passa;
- testes da fatia passam;
- README da fatia existe;
- demo manual é possível.

## 4. Definição de pronto do MVP

- editor e preview utilizáveis;
- CLI funcional;
- 3 pipelines reais;
- stack local simples;
- documentação suficiente para outro dev continuar;
- estrutura boa para iteração por agente.

## 5. Dependências

- M1 depende de M0
- M2 depende de M0
- M3 depende de M2
- M4 depende de M2 e M3
- M5 depende de M1 e M4
- M6 depende de todas

## 6. Riscos de entrega

- tentar suportar recursos editoriais demais cedo;
- acoplamento de prompt no frontend;
- contratos mudando sem versionamento interno;
- observabilidade entrar tarde demais.
