import { useState, useEffect, useCallback } from "react";

type WorkspaceTreeState =
  | { status: "loading" }
  | { status: "success"; files: string[] }
  | { status: "error"; message: string };

export function useWorkspaceTree() {
  const [state, setState] = useState<WorkspaceTreeState>({ status: "loading" });

  const fetchTree = useCallback(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetch("/api/workspace/tree")
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<string[]>;
      })
      .then((files) => {
        if (!cancelled) setState({ status: "success", files });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Erro desconhecido";
          setState({ status: "error", message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cancel = fetchTree();
    return cancel;
  }, [fetchTree]);

  const refetch = useCallback(() => {
    fetchTree();
  }, [fetchTree]);

  return { ...state, refetch };
}
