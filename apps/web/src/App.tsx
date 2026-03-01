import { useState, useEffect, type ReactNode } from "react";
import "./index.css";
import { AppLayout } from "./components/AppLayout";
import { WorkspaceTree } from "./components/WorkspaceTree";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { MarkdownPreview } from "./components/MarkdownPreview";
import { CommandPalette } from "./components/CommandPalette";
import { AgentsPanel } from "./components/AgentsPanel";
import { useEditorState } from "./hooks/useEditorState";
import { useTheme } from "./hooks/useTheme";
import { useWorkspaceTree } from "./hooks/useWorkspaceTree";
import { useRunState } from "./hooks/useRunState";

export default function App() {
  // ── Editor state (file, content, dirty flag, debounce, ref, autosave) ────
  const {
    selectedFile,
    setSelectedFile,
    content,
    setContent,
    isDirty,
    setIsDirty,
    debouncedContent,
    editorRef,
    fileLoader,
    saveStatus,
  } = useEditorState();

  // ── Selection state (stays in App.tsx) ───────────────────────────────────
  const [selectedText, setSelectedText] = useState("");

  // ── US-012: Theme ─────────────────────────────────────────────────────────
  const [theme, toggleTheme] = useTheme();

  // ── Workspace file list ───────────────────────────────────────────────────
  const workspaceTree = useWorkspaceTree();

  // ── US-009: Command Palette ───────────────────────────────────────────────
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // ── US-012: Run state (appMode, pendingRun, runResult, callbacks) ─────────
  const {
    appMode,
    setAppMode,
    pendingRun,
    runResult,
    runHistory,
    handlePaletteExecute,
    handleRunResult,
    handleRunError,
    handleReplaceSelection,
    handleAppend,
    handleSaveAs,
  } = useRunState(editorRef, setContent, setIsDirty);

  // ── Ctrl+K → open command palette (only when a file is open) ──────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (selectedFile) setIsPaletteOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedFile]);

  // ── Save status label ─────────────────────────────────────────────────────
  const saveLabel: Record<typeof saveStatus, string> = {
    idle: "",
    saving: "Salvando…",
    saved: "Salvo",
    error: "Erro ao salvar",
  };
  const saveLabelColor: Record<typeof saveStatus, string> = {
    idle: "var(--color-muted)",
    saving: "var(--color-muted)",
    saved: "#22c55e",
    error: "var(--color-error, #e53e3e)",
  };

  // ── Header actions ────────────────────────────────────────────────────────
  const headerActions: ReactNode = (
    <>
      {/* US-008: save status indicator */}
      {saveStatus !== "idle" && (
        <span
          style={{
            fontSize: 12,
            color: saveLabelColor[saveStatus],
            whiteSpace: "nowrap",
          }}
        >
          {saveLabel[saveStatus]}
        </span>
      )}

      {/* US-009: open palette button */}
      <button
        onClick={() => selectedFile && setIsPaletteOpen(true)}
        disabled={!selectedFile}
        style={{
          fontSize: 12,
          padding: "4px 10px",
          borderRadius: 4,
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: selectedFile ? "var(--color-text)" : "var(--color-muted)",
          cursor: selectedFile ? "pointer" : "not-allowed",
          whiteSpace: "nowrap",
          opacity: selectedFile ? 1 : 0.5,
        }}
        title={selectedFile ? "Open command palette (Ctrl+K)" : "Open a file first to use AI commands"}
      >
        ⌘ AI Commands
      </button>

      {/* US-012: theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          fontSize: 13,
          padding: "4px 8px",
          borderRadius: 4,
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text)",
          cursor: "pointer",
        }}
        title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        aria-label="Toggle theme"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </>
  );

  // ── Editor slot ───────────────────────────────────────────────────────────
  let editorSlot: ReactNode;
  if (fileLoader.status === "loading") {
    editorSlot = (
      <span
        style={{
          padding: "16px",
          display: "block",
          color: "var(--color-muted)",
          fontStyle: "italic",
        }}
      >
        Carregando…
      </span>
    );
  } else if (fileLoader.status === "error") {
    editorSlot = (
      <span
        style={{
          padding: "16px",
          display: "block",
          color: "var(--color-error, #e53e3e)",
        }}
      >
        ⚠ Erro ao carregar arquivo: {fileLoader.message}
      </span>
    );
  } else if (selectedFile) {
    editorSlot = (
      <MarkdownEditor
        ref={editorRef}
        value={content}
        onChange={(val) => {
          setContent(val);
          setIsDirty(true);
        }}
        onSelectionChange={setSelectedText}
        theme={theme}
      />
    );
  }

  // ── Preview slot ─ always shows markdown preview (small column) ─────────────────────
  const previewSlot: ReactNode = <MarkdownPreview content={debouncedContent} />;

  // ── Agents slot (always-on panel with state, result, history) ──────────────
  const agentsSlot: ReactNode = (
    <AgentsPanel
      hasFile={!!selectedFile}
      selectedText={selectedText}
      content={content}
      onRun={handlePaletteExecute}
      appMode={appMode}
      pendingRun={pendingRun}
      selectedFile={selectedFile}
      runResult={runResult}
      runHistory={runHistory}
      onRunResult={handleRunResult}
      onRunError={handleRunError}
      onResultClose={() => setAppMode("preview")}
      onReplaceSelection={handleReplaceSelection}
      onAppend={handleAppend}
      onSaveAs={handleSaveAs}
    />
  );

  return (
    <>
      {/* US-009: Command Palette overlay */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onExecute={handlePaletteExecute}
        selectedText={selectedText}
        content={content}
      />

      <AppLayout
        currentFile={selectedFile}
        headerActions={headerActions}
        sidebar={
          workspaceTree.status === "loading" ? (
            <p style={{ padding: "12px 16px", color: "var(--color-muted)", fontSize: 13 }}>
              Carregando arquivos…
            </p>
          ) : workspaceTree.status === "error" ? (
            <p style={{ padding: "12px 16px", color: "var(--color-error, #e53e3e)", fontSize: 13 }}>
              ⚠ {workspaceTree.message}
            </p>
          ) : (
            <WorkspaceTree
              files={workspaceTree.files}
              onSelect={(path) => {
                setSelectedFile(path);
                setAppMode("preview");
              }}
              selectedFile={selectedFile}
              onCreateFile={async (filePath) => {
                const res = await fetch("/api/files", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ path: filePath }),
                });
                if (res.ok) {
                  workspaceTree.refetch();
                  setSelectedFile(filePath);
                  setAppMode("preview");
                  return null;
                }
                const body = await res.json().catch(() => ({})) as { error?: string };
                return body.error ?? `Erro ${res.status}`;
              }}
              onRenameFile={async (from, to) => {
                const res = await fetch("/api/files/rename", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ from, to }),
                });
                if (res.ok) {
                  workspaceTree.refetch();
                  if (selectedFile === from) {
                    setSelectedFile(to);
                  }
                  return null;
                }
                const body = await res.json().catch(() => ({})) as { error?: string };
                return body.error ?? `Erro ${res.status}`;
              }}
              onDeleteFile={async (filePath) => {
                const res = await fetch(`/api/files?path=${encodeURIComponent(filePath)}`, {
                  method: "DELETE",
                });
                if (res.ok) {
                  workspaceTree.refetch();
                  if (selectedFile === filePath) {
                    setSelectedFile(undefined);
                    setContent("");
                    setIsDirty(false);
                  }
                  return null;
                }
                const body = await res.json().catch(() => ({})) as { error?: string };
                return body.error ?? `Erro ${res.status}`;
              }}
            />
          )
        }
        editor={editorSlot}
        preview={previewSlot}
        agents={agentsSlot}
      />
    </>
  );
}
