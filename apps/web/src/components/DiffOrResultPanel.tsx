import { useState } from "react";
import "./DiffOrResultPanel.css";

interface DiffOrResultPanelProps {
  result: string;
  onClose: () => void;
  onReplaceSelection: (text: string) => void;
  onAppend: (text: string) => void;
  onSaveAs: (path: string, content: string) => void;
}

export function DiffOrResultPanel({
  result,
  onClose,
  onReplaceSelection,
  onAppend,
  onSaveAs,
}: DiffOrResultPanelProps) {
  const [saveAsMode, setSaveAsMode] = useState(false);
  const [newFilename, setNewFilename] = useState("");
  const [copied, setCopied] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  };

  const handleSaveAs = () => {
    if (!newFilename.trim()) return;
    const path = newFilename.trim().endsWith(".md")
      ? newFilename.trim()
      : `${newFilename.trim()}.md`;
    onSaveAs(path, result);
    setSaveAsMode(false);
    setNewFilename("");
  };

  return (
    <div className={`diff-panel${minimized ? " diff-panel--minimized" : ""}`}>
      <div className="diff-panel__header">
        <span className="diff-panel__title">AI Result</span>
        <div className="diff-panel__header-actions">
          <button
            className="diff-btn diff-btn--icon"
            onClick={() => setMinimized((v) => !v)}
            title={minimized ? "Expand" : "Minimize"}
          >
            {minimized ? "▲" : "▼"}
          </button>
          <button className="diff-btn diff-btn--icon" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="diff-panel__content">
            <pre className="diff-result">{result}</pre>
          </div>

          <div className="diff-panel__actions">
            <button className="diff-btn" onClick={handleCopy}>
              {copied ? "✓ Copiado!" : "Copiar"}
            </button>
            <button className="diff-btn" onClick={() => onReplaceSelection(result)}>
              Substituir seleção
            </button>
            <button className="diff-btn" onClick={() => onAppend(result)}>
              Anexar ao fim
            </button>
            {!saveAsMode ? (
              <button className="diff-btn" onClick={() => setSaveAsMode(true)}>
                Salvar como novo arquivo
              </button>
            ) : (
              <div className="diff-save-as">
                <input
                  className="diff-save-as__input"
                  type="text"
                  placeholder="nome-do-arquivo.md"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveAs();
                    if (e.key === "Escape") setSaveAsMode(false);
                  }}
                  autoFocus
                />
                <button className="diff-btn diff-btn--primary" onClick={handleSaveAs}>
                  Salvar
                </button>
                <button className="diff-btn" onClick={() => setSaveAsMode(false)}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
