import { useState, useEffect, useRef } from "react";
import { useDebounce } from "./useDebounce";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounced autosave: fires PUT /api/files/content after 1 second of no changes.
 * Only saves when `dirty` is true (user has edited the content since the last load).
 * Resets status to 'idle' when `path` changes (new file opened).
 */
export function useSaveFile(
  path: string | undefined,
  content: string,
  dirty: boolean
): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const debouncedContent = useDebounce(content, 1000);

  // Use refs so the effect closure always reads current values without re-running
  const pathRef = useRef(path);
  const dirtyRef = useRef(dirty);
  pathRef.current = path;
  dirtyRef.current = dirty;

  // Trigger save whenever debounced content settles
  useEffect(() => {
    if (!pathRef.current || !dirtyRef.current) return;

    setStatus("saving");
    let cancelled = false;

    fetch("/api/files/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathRef.current, content: debouncedContent }),
    })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStatus("saved");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset status when a different file is opened
  useEffect(() => {
    setStatus("idle");
  }, [path]);

  return status;
}
