import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import "./index.css";
import { AppLayout } from "./components/AppLayout";
import { WorkspaceTree } from "./components/WorkspaceTree";
import { MarkdownEditor, type MarkdownEditorHandle } from "./components/MarkdownEditor";
import { MarkdownPreview } from "./components/MarkdownPreview";
import { CommandPalette, type CommandPalettePayload } from "./components/CommandPalette";
import { RunPanel } from "./components/RunPanel";
import { DiffOrResultPanel } from "./components/DiffOrResultPanel";
import { useDebounce } from "./hooks/useDebounce";
import { useFileLoader } from "./hooks/useFileLoader";
import { useSaveFile } from "./hooks/useSaveFile";
import { useTheme } from "./hooks/useTheme";

const DEMO_FILES = [
  "notes/readme.md",
  "notes/getting-started.md",
  "docs/architecture.md",
  "docs/api-reference.md",
  "journal/2024-01-15.md",
];

// ── App-mode: what is showing in the right (preview) panel ──────────────────
type AppMode = "preview" | "running" | "result";

export default function App() {
  // ── File & content state ─────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [content, setContent] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const debouncedContent = useDebounce(content, 300);
  const fileLoader = useFileLoader(selectedFile);

  // ── US-008: Autosave ──────────────────────────────────────────────────────
  const saveStatus = useSaveFile(selectedFile, content, isDirty);

  // ── US-012: Theme ─────────────────────────────────────────────────────────
  const [theme, toggleTheme] = useTheme();

  // ── US-009: Command Palette ───────────────────────────────────────────────
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // ── US-010: Run Panel ─────────────────────────────────────────────────────
  const [appMode, setAppMode] = useState<AppMode>("preview");
  const [pendingRun, setPendingRun] = useState<CommandPalettePayload | null>(null);

  // ── US-011: Diff/Result Panel ─────────────────────────────────────────────
  const [runResult, setRunResult] = useState("");

  // ── MarkdownEditor imperative ref (for replaceSelection) ─────────────────
  const editorRef = useRef<MarkdownEditorHandle>(null);

  // ── Sync loaded file content into editor ─────────────────────────────────
  useEffect(() => {
    if (fileLoader.status === "success") {
      setContent(fileLoader.content);
      setIsDirty(false);
    }
  }, [fileLoader]);

  // ── Ctrl+K → open command palette ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsPaletteOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Handle palette execute → start run ───────────────────────────────────
  const handlePaletteExecute = useCallback((payload: CommandPalettePayload) => {
    setPendingRun(payload);
    setRunResult("");
    setAppMode("running");
  }, []);

  // ── When run finishes ─────────────────────────────────────────────────────
  const handleRunResult = useCallback((result: string) => {
    setRunResult(result);
    setAppMode("result");
  }, []);

  // ── DiffOrResultPanel actions ─────────────────────────────────────────────
  const handleReplaceSelection = useCallback((text: string) => {
    if (editorRef.current) {
      editorRef.current.replaceSelection(text);
      setIsDirty(true);
    }
  }, []);

  const handleAppend = useCallback((text: string) => {
    setContent((prev) => prev + "\n\n" + text);
    setIsDirty(true);
  }, []);

  const handleSaveAs = useCallback(async (path: string, fileContent: string) => {
    await fetch("/api/files/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content: fileContent }),
    });
  }, []);

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
        onClick={() => setIsPaletteOpen(true)}
        style={{
          fontSize: 12,
          padding: "4px 10px",
          borderRadius: 4,
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text)",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        title="Open command palette (Ctrl+K)"
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

  // ── Right-panel slot (preview / run / result) ─────────────────────────────
  let rightSlot: ReactNode;
  if (appMode === "running" && pendingRun && selectedFile) {
    rightSlot = (
      <RunPanel
        command={pendingRun.command}
        context={pendingRun.context}
        target={{ type: "file", path: selectedFile }}
        onResult={handleRunResult}
        onClose={() => setAppMode("preview")}
      />
    );
  } else if (appMode === "result" && runResult) {
    rightSlot = (
      <DiffOrResultPanel
        result={runResult}
        onClose={() => setAppMode("preview")}
        onReplaceSelection={handleReplaceSelection}
        onAppend={handleAppend}
        onSaveAs={handleSaveAs}
      />
    );
  } else {
    rightSlot = <MarkdownPreview content={debouncedContent} />;
  }

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
          <WorkspaceTree
            files={DEMO_FILES}
            onSelect={(path) => {
              setSelectedFile(path);
              setAppMode("preview");
            }}
            selectedFile={selectedFile}
          />
        }
        editor={editorSlot}
        preview={rightSlot}
      />
    </>
  );
}
