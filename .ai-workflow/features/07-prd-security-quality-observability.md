# 07 - PRD - Segurança, qualidade e observabilidade

## 1. Objetivo

Definir requisitos transversais do EvenNotes.

## 2. Segurança

### Requisitos
- limitar acesso do workspace ao diretório configurado;
- impedir path traversal;
- sanitizar renderização Markdown;
- separar claramente config secreta de config de app;
- mascarar segredos em logs;
- não persistir conteúdo sensível sem intenção explícita do usuário.

## 3. Qualidade

### Estratégia de testes
- unit tests para domínio e adapters puros;
- integration tests para API;
- smoke tests para CLI;
- testes de renderização para editor/preview;
- testes de pipeline com fixtures.

### Gates
- lint
- typecheck
- test
- build

## 4. Observabilidade

### Logging
- estruturado;
- correlação por `runId`;
- níveis consistentes.

### Tracing IA
- integrar LangSmith opcionalmente;
- registrar etapas de pipeline;
- capturar custo, latência e falhas quando possível.

### Métricas futuras
- runs por comando;
- latência por pipeline;
- taxa de erro por provider;
- tamanho médio de contexto.

## 5. Resiliência

- timeouts configuráveis;
- retries conservadores quando fizer sentido;
- circuit breaker futuro para provider;
- mensagens de falha legíveis.

## 6. Critérios de aceite

- rotas e filesystem respeitam limite de workspace;
- preview não executa conteúdo inseguro;
- logs permitem seguir uma execução do começo ao fim;
- existe suíte mínima cobrindo fluxos críticos.
