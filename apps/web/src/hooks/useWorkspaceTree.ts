import { useState, useEffect } from "react";

type WorkspaceTreeState =
  | { status: "loading" }
  | { status: "success"; files: string[] }
  | { status: "error"; message: string };

export function useWorkspaceTree(): WorkspaceTreeState {
  const [state, setState] = useState<WorkspaceTreeState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/workspace/tree")
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<string[]>;
      })
      .then((files) => setState({ status: "success", files }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setState({ status: "error", message });
      });
  }, []);

  return state;
}
