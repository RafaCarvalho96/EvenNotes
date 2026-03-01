# 02 - PRD - Frontend Editor

## 1. Objetivo

Definir o editor Markdown, a experiência de preview e a UX local do EvenNotes.

## 2. Decisões técnicas

### Stack recomendada
- React
- Vite
- TypeScript
- CodeMirror 6
- react-markdown
- remark/rehype plugins
- estado local simples com store leve

## 3. Por que essa stack

- Vite oferece setup moderno e rápido para frontend TS.
- CodeMirror 6 é extensível e apropriado para editor rico focado em texto.
- react-markdown permite render seguro sem `dangerouslySetInnerHTML` como caminho padrão.
- remark/rehype permitem pipeline clara de transformação.

## 4. Escopo MVP

### In scope
- lista de arquivos do workspace;
- editor principal;
- preview lado a lado;
- autosave;
- seleção de texto;
- comando de IA contextual;
- exibição de execução e resultado;
- tema claro/escuro simples;
- atalhos básicos.

### Out of scope
- edição WYSIWYG;
- colaboração real-time;
- drag and drop avançado;
- extensão/plugin marketplace.

## 5. Layout base

- sidebar esquerda: workspace e arquivos
- painel central: editor
- painel direito: preview e/ou resultados de IA
- header simples: estado, arquivo atual, comando rápido
- footer opcional: status, provider, token/custo estimado

## 6. Requisitos funcionais

1. Abrir e listar arquivos `.md`.
2. Trocar entre arquivos sem perder alterações já salvas.
3. Atualizar preview em near-real-time.
4. Suportar Markdown comum e GFM.
5. Renderizar blocos de código corretamente.
6. Permitir execução de comando IA sobre:
   - documento;
   - seleção;
   - contexto do arquivo.
7. Mostrar progresso de execução.
8. Mostrar resultado separadamente antes de aplicar no documento.
9. Permitir copiar ou substituir conteúdo.
10. Persistir estado de UI básico localmente.

## 7. Requisitos não funcionais

- Digitação não deve travar por causa do preview.
- Renderização deve ser segura.
- Componentes devem ser isolados e testáveis.
- O frontend não deve conhecer detalhes internos do provider LLM.

## 8. Modelo de interação

### A. Editor -> Preview
- atualização por debounce curto;
- preview derivado do texto atual;
- fallback para renderização sob demanda em documentos grandes.

### B. Editor -> IA
- usuário seleciona conteúdo;
- frontend envia payload padronizado;
- backend responde com stream de status e saída.

### C. Resultado -> Aplicação
- resultado fica em painel separado;
- usuário escolhe:
  - copiar;
  - substituir seleção;
  - anexar ao fim;
  - salvar em novo arquivo.

## 9. Segurança de renderização

- desabilitar HTML cru por padrão;
- se houver suporte futuro a HTML raw, usar sanitização explícita;
- bloquear scripts e conteúdo inseguro.

## 10. Componentes sugeridos

- `WorkspaceTree`
- `EditorTabs`
- `MarkdownEditor`
- `MarkdownPreview`
- `CommandPalette`
- `RunPanel`
- `ExecutionStatus`
- `DiffOrResultPanel`

## 11. Estrutura sugerida do frontend

- `apps/web/src/app`
- `apps/web/src/features/editor`
- `apps/web/src/features/workspace`
- `apps/web/src/features/commands`
- `apps/web/src/features/executions`
- `apps/web/src/components`
- `apps/web/src/lib`
- `apps/web/src/styles`

## 12. Critérios de aceite

- Abrir e editar `.md` com estabilidade.
- Preview renderiza headings, listas, tabelas e code blocks.
- Executar comando de IA a partir da seleção.
- Mostrar streaming/status sem congelar a UI.
- Aplicar resultado ao documento com ação explícita do usuário.
