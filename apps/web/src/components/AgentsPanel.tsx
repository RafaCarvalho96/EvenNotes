import { useState } from "react";
import type { CommandPalettePayload } from "./CommandPalette";
import { RunPanel } from "./RunPanel";
import type { RunHistoryEntry } from "../hooks/useRunState";
import "./AgentsPanel.css";

const AGENTS = [
  { id: "summarize",   label: "Summarize",   description: "Resumir texto/documento",          icon: "📝" },
  { id: "rewrite",     label: "Rewrite",     description: "Reescrever texto selecionado",      icon: "✏️" },
  { id: "create-prd",  label: "Create PRD",  description: "Gerar PRD a partir do documento",  icon: "📋" },
] as const;

type AppMode = "preview" | "running" | "result";

interface AgentsPanelProps {
  hasFile: boolean;
  selectedText: string;
  content: string;
  onRun: (payload: CommandPalettePayload) => void;
  // ── Run state ──────────────────────────────────────────────────
  appMode: AppMode;
  pendingRun: CommandPalettePayload | null;
  selectedFile?: string;
  runResult: string;
  runHistory: RunHistoryEntry[];
  // ── Callbacks ──────────────────────────────────────────────────
  onRunResult: (result: string) => void;
  onRunError: (msg: string) => void;
  onResultClose: () => void;
  onReplaceSelection: (text: string) => void;
  onAppend: (text: string) => void;
  onSaveAs: (path: string, content: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5)   return "agora";
  if (diff < 60)  return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

function formatDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const COMMAND_LABELS: Record<string, string> = {
  summarize: "Summarize",
  rewrite: "Rewrite",
  "create-prd": "Create PRD",
};

// ── Result actions section ────────────────────────────────────────────────────

interface ResultActionsProps {
  result: string;
  onClose: () => void;
  onReplaceSelection: (text: string) => void;
  onAppend: (text: string) => void;
  onSaveAs: (path: string, content: string) => void;
}

function ResultActions({ result, onClose, onReplaceSelection, onAppend, onSaveAs }: ResultActionsProps) {
  const [saveMode, setSaveMode] = useState(false);
  const [filename, setFilename] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* ignore */ }
  };

  const handleSave = () => {
    if (!filename.trim()) return;
    const path = filename.trim().endsWith(".md") ? filename.trim() : `${filename.trim()}.md`;
    onSaveAs(path, result);
    setSaveMode(false);
    setFilename("");
  };

  return (
    <div className="agents-result">
      <div className="agents-result__header">
        <span className="agents-result__title">✅ Resultado</span>
        <button className="agents-result__close" onClick={onClose} title="Fechar">✕</button>
      </div>

      <pre className="agents-result__output">{result}</pre>

      <div className="agents-result__actions">
        <button className="agents-action-btn agents-action-btn--primary" onClick={() => { onReplaceSelection(result); onClose(); }}>
          ↩ Substituir seleção
        </button>
        <button className="agents-action-btn" onClick={() => { onAppend(result); onClose(); }}>
          ＋ Anexar
        </button>
        <button className="agents-action-btn" onClick={handleCopy}>
          {copied ? "✓ Copiado" : "⎘ Copiar"}
        </button>
        <button className="agents-action-btn" onClick={() => setSaveMode((v) => !v)}>
          💾 Salvar como…
        </button>
      </div>

      {saveMode && (
        <div className="agents-result__save-row">
          <input
            className="agents-result__save-input"
            placeholder="nome-do-arquivo.md"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setSaveMode(false); }}
            autoFocus
          />
          <button className="agents-action-btn agents-action-btn--primary" onClick={handleSave}>OK</button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AgentsPanel({
  hasFile,
  selectedText,
  content,
  onRun,
  appMode,
  pendingRun,
  selectedFile,
  runResult,
  runHistory,
  onRunResult,
  onRunError,
  onResultClose,
  onReplaceSelection,
  onAppend,
  onSaveAs,
}: AgentsPanelProps) {
  const [historyOpen, setHistoryOpen] = useState(true);

  return (
    <div className="agents-panel">

      {/* ── Agent list ──────────────────────────────────────────── */}
      <section className="agents-section">
        <p className="agents-section__hint">
          {hasFile ? "Executar agente no arquivo aberto:" : "Abra um arquivo para usar os agentes."}
        </p>
        <ul className="agents-list">
          {AGENTS.map((agent) => (
            <li key={agent.id} className="agent-card">
              <span className="agent-card__icon" aria-hidden="true">{agent.icon}</span>
              <div className="agent-card__body">
                <span className="agent-card__label">{agent.label}</span>
                <span className="agent-card__desc">{agent.description}</span>
              </div>
              <button
                className="agent-card__run-btn"
                disabled={!hasFile || appMode === "running"}
                title={hasFile ? `Executar ${agent.label}` : "Abra um arquivo primeiro"}
                onClick={() => onRun({ command: agent.id, context: selectedText || content })}
              >
                {appMode === "running" && pendingRun?.command === agent.id ? "…" : "▶ Run"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Active run ──────────────────────────────────────────── */}
      {appMode === "running" && pendingRun && selectedFile && (
        <section className="agents-section agents-section--active">
          <div className="agents-section__title">
            <span className="agents-active-dot" aria-hidden="true" />
            Executando: <strong>{COMMAND_LABELS[pendingRun.command] ?? pendingRun.command}</strong>
          </div>
          <div className="agents-run-embed">
            <RunPanel
              command={pendingRun.command}
              context={pendingRun.context}
              target={{ type: "file", path: selectedFile }}
              onResult={onRunResult}
              onError={onRunError}
              onClose={onResultClose}
            />
          </div>
        </section>
      )}

      {appMode === "running" && pendingRun && !selectedFile && (
        <section className="agents-section agents-section--error">
          ⚠ Abra um arquivo antes de usar os agentes.
        </section>
      )}

      {/* ── Result ──────────────────────────────────────────────── */}
      {appMode === "result" && runResult && (
        <section className="agents-section">
          <ResultActions
            result={runResult}
            onClose={onResultClose}
            onReplaceSelection={onReplaceSelection}
            onAppend={onAppend}
            onSaveAs={onSaveAs}
          />
        </section>
      )}

      {/* ── History ─────────────────────────────────────────────── */}
      {runHistory.length > 0 && (
        <section className="agents-section agents-section--history">
          <button
            className="agents-history__toggle"
            onClick={() => setHistoryOpen((v) => !v)}
            aria-expanded={historyOpen}
          >
            <span>{historyOpen ? "▾" : "▸"} Histórico</span>
            <span className="agents-history__count">{runHistory.length}</span>
          </button>

          {historyOpen && (
            <ul className="agents-history__list">
              {runHistory.map((entry) => (
                <li key={entry.id} className={`history-entry history-entry--${entry.status}`}>
                  <span className="history-entry__icon" aria-hidden="true">
                    {entry.status === "success" ? "✓" : "✗"}
                  </span>
                  <div className="history-entry__body">
                    <span className="history-entry__cmd">
                      {COMMAND_LABELS[entry.command] ?? entry.command}
                    </span>
                    <span className="history-entry__meta">
                      {formatDuration(entry.startedAt, entry.finishedAt)}
                      &nbsp;·&nbsp;
                      {formatRelativeTime(entry.finishedAt)}
                    </span>
                    {entry.status === "error" && entry.errorMsg && (
                      <span className="history-entry__error">{entry.errorMsg}</span>
                    )}
                    {entry.status === "success" && entry.result && (
                      <span className="history-entry__preview">
                        {entry.result.slice(0, 80)}{entry.result.length > 80 ? "…" : ""}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
