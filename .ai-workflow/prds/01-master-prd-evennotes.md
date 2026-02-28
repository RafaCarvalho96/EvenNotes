# 01 - Master PRD - EvenNotes

## 1. Visão do produto

EvenNotes é um editor Markdown focado em escrita técnica e execução assistida por IA.
O produto combina:
- edição de arquivos `.md`;
- visualização/preview segura e rápida;
- organização local de documentos;
- execução de comandos por CLI;
- pipeline de IA para análise, transformação e geração de artefatos textuais.

A proposta é ser ao mesmo tempo:
- uma ferramenta de escrita;
- uma superfície operacional para prompts e pipelines;
- um workspace local para documentação técnica orientada por agente.

## 2. Problema

Ferramentas atuais normalmente se separam em dois grupos:
- editores Markdown bons para escrever, mas fracos em automação por IA;
- ferramentas de IA boas em execução, mas fracas em controle local, previsibilidade e fluxo documental.

O problema central é a falta de uma ferramenta que una:
- texto local em arquivos simples;
- preview confiável;
- automação estruturada;
- operação por CLI;
- arquitetura clara para múltiplos fluxos de IA.

## 3. Objetivo do produto

Entregar uma aplicação que permita ao usuário:
1. abrir e editar Markdown localmente;
2. visualizar renderização em tempo real;
3. rodar comandos de IA sobre arquivos ou seleções;
4. compor pipelines reproduzíveis;
5. manter tudo versionável em Git e operável por terminal.

## 4. Objetivos de negócio/produto

- Reduzir fricção entre escrita e automação.
- Tornar o uso de IA reproduzível, auditável e composável.
- Servir de base para workflows maiores de documentação, PRD, especificação e refatoração textual.
- Permitir evolução futura para plugins, sync remoto, avaliação de prompts e agentes especializados.

## 5. Público-alvo inicial

### 5.1 Primário
Desenvolvedores, arquitetos, PMs técnicos e criadores de documentação técnica.

### 5.2 Secundário
Times de AI engineering que querem operar documentação e prompts localmente.

## 6. Jobs to be done

- "Quero editar meus arquivos Markdown e ver o preview imediatamente."
- "Quero transformar um documento usando IA sem sair do meu workspace."
- "Quero rodar uma pipeline reproduzível por CLI."
- "Quero gerar PRDs, resumos, checklists ou refactors textuais sobre meus arquivos."
- "Quero manter histórico em Git, sem ficar preso a um formato proprietário."

## 7. Proposta de valor

EvenNotes oferece:
- arquivos locais e transparentes;
- preview Markdown de boa qualidade;
- automação IA estruturada;
- CLI de comando simples;
- arquitetura modular em TypeScript.

## 8. Escopo MVP

### In scope
- editor Markdown com autosave;
- preview lado a lado;
- abertura de workspace local;
- árvore de arquivos simples;
- execução de comandos de IA por CLI;
- serviço backend mínimo para orquestração;
- suporte inicial a prompts, tasks e pipelines;
- streaming de execução;
- logs e histórico local básico;
- Docker Compose para desenvolvimento.

### Out of scope no MVP
- colaboração em tempo real;
- sync cloud multiusuário;
- marketplace de plugins;
- billing;
- autenticação multi-tenant;
- mobile app;
- CRDT/offline merge avançado.

## 9. Princípios do produto

- Markdown-first
- Local-first
- Agent-ready
- DX-first
- Estrutura simples
- Observabilidade desde cedo
- Contratos claros entre editor, API e pipeline

## 10. Requisitos funcionais macro

1. O usuário deve poder abrir um diretório de notas/projeto.
2. O usuário deve poder editar um arquivo `.md`.
3. O usuário deve ver o preview renderizado.
4. O usuário deve disparar uma ação de IA sobre:
   - arquivo inteiro;
   - seleção;
   - conjunto de arquivos;
   - pipeline nomeada.
5. O sistema deve exibir status de execução.
6. O sistema deve persistir artefatos gerados localmente.
7. O CLI deve permitir executar os mesmos fluxos sem UI.
8. A arquitetura deve suportar novos comandos, novas tools e novos providers.

## 11. Requisitos não funcionais macro

- Startup local simples via Docker Compose.
- Forte tipagem TypeScript.
- Tempo de resposta aceitável para edição local.
- Tolerância a falha de provider de IA.
- Logging estruturado.
- Facilidade de teste.
- Baixo acoplamento entre interface, domínio e provider de IA.

## 12. Métricas de sucesso do MVP

- Tempo para abrir workspace < 3 segundos em projeto pequeno local.
- Preview perceptivelmente responsivo em edição comum.
- Primeiro comando de IA executável em menos de 5 minutos após `docker compose up`.
- Pelo menos 3 pipelines úteis no MVP:
  - summarize;
  - rewrite;
  - create-prd.
- Taxa de falha recuperável em execuções de pipeline com mensagens claras.
- Cobertura mínima de testes nos módulos críticos.

## 13. Fluxos ponta a ponta principais

### Fluxo A - Escrita simples
1. usuário abre workspace;
2. seleciona arquivo `.md`;
3. edita texto;
4. preview atualiza;
5. autosave persiste.

### Fluxo B - Ação IA sobre seleção
1. usuário seleciona trecho;
2. escolhe comando;
3. backend monta contexto;
4. pipeline executa;
5. resultado é exibido;
6. usuário aceita, copia ou aplica.

### Fluxo C - Pipeline por CLI
1. usuário chama comando em terminal;
2. CLI resolve arquivo/pipeline/provider;
3. backend local ou runner embutido executa;
4. saída é exibida e opcionalmente salva em arquivo.

### Fluxo D - Geração de documento
1. usuário escolhe template/pipeline;
2. sistema coleta contexto;
3. pipeline gera artefato;
4. usuário revisa diff;
5. documento final é salvo.

## 14. Arquitetura conceitual

Camadas:
- frontend editor;
- backend API mínima;
- engine de pipeline;
- adapters de provider LLM;
- filesystem adapter;
- CLI;
- observabilidade/logs.

## 15. Restrições

- Tudo deve funcionar localmente.
- O repositório deve ficar organizado por pacotes/pastas.
- O sistema deve ser compatível com Docker Compose.
- O backend deve ser Node.js/TypeScript.
- A API deve permanecer mínima e limpa.

## 16. Riscos principais

- excesso de escopo no editor;
- acoplamento prematuro a um provider de IA;
- pipeline de IA monolítica e difícil de testar;
- preview inseguro ao lidar com HTML;
- UX ruim para streaming e revisão de resultado.

## 17. Estratégia de entrega

Entregar em fatias:
1. fundação monorepo + compose;
2. editor + preview;
3. API mínima + filesystem;
4. CLI + comandos simples;
5. pipeline LangChain/LangGraph;
6. logs, testes e hardening.

## 18. Dependências cruzadas

Ver PRDs filhas:
- frontend/editor;
- backend/api;
- IA/CLI;
- devops;
- qualidade/segurança.

## 19. Critérios de aceite do produto MVP

- É possível subir o stack local.
- É possível editar e renderizar Markdown.
- É possível rodar pelo menos 3 comandos de IA.
- É possível executar o mesmo comando via CLI.
- Logs e erros são compreensíveis.
- O repositório está organizado para evolução incremental.

## 20. Futuro pós-MVP

- plugins;
- templates compartilháveis;
- sync remoto;
- avaliações automáticas de pipelines;
- multi-provider routing;
- RAG por workspace;
- revisão baseada em diff;
- modos assistente especializados.
