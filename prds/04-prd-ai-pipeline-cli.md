# 04 - PRD - AI Pipeline + CLI

## 1. Objetivo

Definir a camada de automação por CLI e a pipeline de IA do EvenNotes.

## 2. Decisão técnica

### Stack recomendada
- Commander.js para CLI
- LangChain v1 para agentes simples e padronização
- LangGraph para workflows duráveis, stateful e expansíveis
- abstração de provider/model
- templates e pipelines declarados por arquivo

## 3. Posição arquitetural

A CLI não deve conter lógica de negócio pesada.
Ela deve:
- interpretar parâmetros;
- montar request;
- disparar execução;
- exibir stream/resultado.

A lógica real fica na engine de pipelines.

## 4. Escopo MVP

### Comandos CLI iniciais
- `evennotes health`
- `evennotes workspace tree`
- `evennotes run summarize <path>`
- `evennotes run rewrite <path>`
- `evennotes run create-prd <path|dir>`
- `evennotes pipelines list`
- `evennotes providers list`

## 5. Casos de uso principais

### A. Sumarizar documento
Entrada: arquivo Markdown
Saída: resumo estruturado

### B. Reescrever trecho
Entrada: seleção ou arquivo
Saída: nova versão textual

### C. Criar PRD
Entrada: pasta ou contexto
Saída: documento ou conjunto de documentos

### D. Checklist técnico
Entrada: documento
Saída: checklist verificável

## 6. Modelo de pipeline

Pipeline deve ser composta por estágios explícitos:
1. input resolution
2. context collection
3. prompt assembly
4. model invocation
5. post-processing
6. output persistence
7. trace/logging

## 7. Por que LangChain + LangGraph

- LangChain JS v1 simplifica a camada de agentes e integração com tools.
- LangGraph complementa com execução stateful e mais robusta para workflows longos.
- Isso preserva um caminho simples no MVP e um caminho escalável para automações mais complexas.

## 8. Estrutura sugerida dos pipelines

- `packages/ai-core`
- `packages/ai-pipelines`
- `packages/prompts`
- `packages/contracts`

### Dentro de `ai-pipelines`
- `summarize.pipeline.ts`
- `rewrite.pipeline.ts`
- `create-prd.pipeline.ts`

## 9. Contrato interno de pipeline

Entrada:
- contexto resolvido;
- comando;
- parâmetros;
- provider;
- metadados do run.

Saída:
- texto final;
- metadados;
- artefatos;
- logs;
- erro tipado quando aplicável.

## 10. Prompting e templates

Prompts devem:
- ser versionados;
- ter placeholders explícitos;
- ficar fora da camada de UI;
- aceitar contexto estruturado, não string solta quando possível.

## 11. Ferramentas internas futuras

- leitura de múltiplos arquivos;
- diff semântico;
- geração de outline;
- normalização de headings;
- splitting de documentos grandes;
- retrieval local por embedding.

## 12. Requisitos não funcionais

- previsibilidade;
- reprodutibilidade básica;
- baixo acoplamento a um provider;
- rastreabilidade por trace/log;
- facilidade de avaliação posterior.

## 13. Falhas esperadas

- timeout de provider;
- output inválido;
- arquivo grande demais;
- contexto insuficiente;
- prompt mal configurado.

O sistema deve falhar com mensagens claras e categorizar erro.

## 14. Critérios de aceite

- CLI executa os comandos principais;
- backend e CLI compartilham contratos;
- pelo menos 3 pipelines operam ponta a ponta;
- execuções podem ser observadas por stream/log;
- provider pode ser trocado por adapter.
