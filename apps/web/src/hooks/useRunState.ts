import { useState, useCallback, useRef, type RefObject } from "react";
import type { CommandPalettePayload } from "../components/CommandPalette";
import type { MarkdownEditorHandle } from "../components/MarkdownEditor";

type AppMode = "preview" | "running" | "result";

export interface RunHistoryEntry {
  id: string;
  command: string;
  status: "success" | "error";
  result: string;
  errorMsg: string;
  startedAt: Date;
  finishedAt: Date;
}

const MAX_HISTORY = 10;

export function useRunState(
  editorRef: RefObject<MarkdownEditorHandle | null>,
  setContent: (updater: (prev: string) => string) => void,
  setIsDirty: (dirty: boolean) => void,
) {
  const [appMode, setAppMode] = useState<AppMode>("preview");
  const [pendingRun, setPendingRun] = useState<CommandPalettePayload | null>(null);
  const [runResult, setRunResult] = useState("");
  const [runHistory, setRunHistory] = useState<RunHistoryEntry[]>([]);

  // Track when the current run started so we can record it in history
  const activeRunRef = useRef<{ command: string; startedAt: Date; id: string } | null>(null);

  const handlePaletteExecute = useCallback((payload: CommandPalettePayload) => {
    const id = `run-${Date.now()}`;
    activeRunRef.current = { command: payload.command, startedAt: new Date(), id };
    setPendingRun(payload);
    setRunResult("");
    setAppMode("running");
  }, []);

  const handleRunResult = useCallback((result: string) => {
    setRunResult(result);
    setAppMode("result");
    if (activeRunRef.current) {
      const { command, startedAt, id } = activeRunRef.current;
      setRunHistory((prev) => [
        { id, command, status: "success" as const, result, errorMsg: "", startedAt, finishedAt: new Date() },
        ...prev,
      ].slice(0, MAX_HISTORY));
      activeRunRef.current = null;
    }
  }, []);

  const handleRunError = useCallback((errorMsg: string) => {
    setAppMode("preview");
    if (activeRunRef.current) {
      const { command, startedAt, id } = activeRunRef.current;
      setRunHistory((prev) => [
        { id, command, status: "error" as const, result: "", errorMsg, startedAt, finishedAt: new Date() },
        ...prev,
      ].slice(0, MAX_HISTORY));
      activeRunRef.current = null;
    }
  }, []);

  const handleReplaceSelection = useCallback((text: string) => {
    if (editorRef.current) {
      editorRef.current.replaceSelection(text);
      setIsDirty(true);
    }
  }, [editorRef, setIsDirty]);

  const handleAppend = useCallback((text: string) => {
    setContent((prev) => prev + "\n\n" + text);
    setIsDirty(true);
  }, [setContent, setIsDirty]);

  const handleSaveAs = useCallback(async (path: string, fileContent: string) => {
    await fetch("/api/files/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content: fileContent }),
    });
  }, []);

  return {
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
  };
}
