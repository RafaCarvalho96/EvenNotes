# 00 - Estilo de PRD recomendado para o EvenNotes

## Objetivo

Definir o estilo de PRD mais adequado para um produto de engenharia assistida por IA, com execução incremental por agente, revisão humana frequente e contexto dividido em múltiplos arquivos Markdown.

## Recomendação

Usar um **PRD mestre + PRDs filhas + backlog executável**.

Não usar uma PRD monolítica tradicional. Em vez disso, usar esta hierarquia:

1. **PRD mestre**
   - visão de produto;
   - objetivos de negócio;
   - personas/jobs;
   - escopo geral;
   - métricas;
   - roadmap macro.

2. **PRDs filhas por domínio**
   - frontend/editor;
   - backend/api;
   - IA/CLI;
   - devops/infra;
   - segurança/qualidade.

3. **ADR/Stack Decision Record**
   - decisões tecnológicas;
   - trade-offs;
   - alternativas rejeitadas.

4. **Backlog executável**
   - épicos;
   - milestones;
   - tarefas pequenas;
   - critérios de aceite objetivos;
   - dependências explícitas.

## Por que esse estilo é compatível com fluxo Ralph

Fluxos do tipo Ralph tendem a performar melhor quando o trabalho é:
- particionado;
- concreto;
- verificável;
- com fronteiras nítidas entre contexto de negócio e contexto técnico;
- com critérios de aceite que possam ser checados por teste, lint ou validação manual.

Por isso, cada PRD filha deve conter:
- problema;
- objetivo;
- escopo in;
- escopo out;
- fluxos principais;
- requisitos funcionais;
- requisitos não funcionais;
- contratos/interfaces;
- riscos;
- critérios de aceite;
- backlog sugerido.

## Template recomendado para cada PRD filha

### 1. Contexto
Qual problema essa parte resolve e por que ela existe.

### 2. Objetivo
Resultado esperado em termos de produto e engenharia.

### 3. Usuários/atores
Quem usa diretamente essa parte do sistema.

### 4. Escopo
O que entra e o que não entra.

### 5. Fluxos principais
Fluxos ponta a ponta, preferencialmente enumerados.

### 6. Requisitos funcionais
Lista objetiva de comportamentos necessários.

### 7. Requisitos não funcionais
Performance, segurança, confiabilidade, DX, observabilidade.

### 8. Modelo de dados e contratos
Tipos, eventos, comandos, payloads, arquivos, APIs.

### 9. Dependências
Pacotes, serviços, módulos internos.

### 10. Critérios de aceite
Itens testáveis, claros, binários.

### 11. Riscos e trade-offs
Onde o sistema pode falhar, e o que foi conscientemente adiado.

### 12. Plano de implementação
Sequência sugerida de execução.

## Convenções de redação

- Escrever em Markdown simples.
- Usar frases curtas.
- Evitar ambiguidade.
- Declarar suposições.
- Nunca misturar visão de produto com detalhe incidental de implementação sem rotular isso claramente.
- Sempre separar:
  - requisito;
  - decisão;
  - hipótese;
  - backlog.

## Convenções de naming para arquivos

- `NN-slug.md`
- Prefixo numérico obrigatório.
- Um arquivo por tema central.
- Nunca deixar backlog escondido em meio ao texto da PRD.

## Regras para tornar os documentos operáveis por agentes

- Cada requisito deve ser pequeno o suficiente para virar tarefa.
- Cada fluxo deve apontar as camadas tocadas.
- Cada aceitação deve ser verificável sem interpretação subjetiva.
- Cada documento deve citar arquivos esperados do repositório quando possível.
- Quando houver prompt, contrato de tool ou interface de agente, isso deve ficar em seção própria.
- Não usar listas enormes de "nice to have" misturadas com escopo MVP.

## Resumo

O estilo ideal para o EvenNotes é:
- **Markdown-first**;
- **master PRD + domain PRDs**;
- **ADRs separados**;
- **backlog executável**;
- **aceites objetivos**;
- **contexto pequeno por iteração**.

Esse é o formato mais alinhado com desenvolvimento assistido por IA e com uma operação estilo Ralph.
