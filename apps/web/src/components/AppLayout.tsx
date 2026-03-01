import "./AppLayout.css";

interface AppLayoutProps {
  currentFile?: string;
  sidebar?: React.ReactNode;
  editor?: React.ReactNode;
  preview?: React.ReactNode;
  /** Always-visible agents panel rendered to the right of the small preview. */
  agents?: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function AppLayout({
  currentFile,
  sidebar,
  editor,
  preview,
  agents,
  headerActions,
}: AppLayoutProps) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <span className="app-header__logo">EvenNotes</span>
        <span className="app-header__title">
          {currentFile ?? "Nenhum arquivo aberto"}
        </span>
        <div className="app-header__actions">{headerActions}</div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <div className="app-sidebar__header">Workspace</div>
          <div className="app-sidebar__content">
            {sidebar ?? (
              <span style={{ padding: "8px 12px", color: "var(--color-muted)", display: "block", fontSize: 13 }}>
                Nenhum arquivo
              </span>
            )}
          </div>
        </aside>

        <section className="app-editor">
          <div className="app-editor__content">
            {editor ?? (
              <span style={{ padding: "16px", display: "block", color: "var(--color-muted)" }}>
                Selecione um arquivo para editar
              </span>
            )}
          </div>
        </section>

        <section className="app-preview">
          <div className="app-preview__header">Preview</div>
          <div className="app-preview__content">
            {preview ?? (
              <span>Preview aparecerá aqui</span>
            )}
          </div>
        </section>

        <section className="app-agents">
          <div className="app-agents__header">Agentes</div>
          <div className="app-agents__content">
            {agents ?? (
              <span style={{ padding: "16px", display: "block", color: "var(--color-muted)", fontSize: 13 }}>
                Abra um arquivo para usar os agentes.
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
