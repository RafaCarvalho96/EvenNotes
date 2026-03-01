import { useState, useEffect, useRef } from "react";

interface FileLoaderIdle {
  status: "idle";
}

interface FileLoaderLoading {
  status: "loading";
}

interface FileLoaderSuccess {
  status: "success";
  content: string;
  loadedPath: string;
}

interface FileLoaderError {
  status: "error";
  message: string;
  loadedPath: string;
}

export type FileLoaderState =
  | FileLoaderIdle
  | FileLoaderLoading
  | FileLoaderSuccess
  | FileLoaderError;

/**
 * Fetches a markdown file's content from GET /api/files/content?path=<selectedPath>.
 * Cancels in-flight requests when selectedPath changes.
 */
export function useFileLoader(selectedPath: string | undefined): FileLoaderState {
  const [state, setState] = useState<FileLoaderState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!selectedPath) {
      setState({ status: "idle" });
      return;
    }

    // Cancel any in-flight request before starting a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading" });

    fetch(`/api/files/content?path=${encodeURIComponent(selectedPath)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        if (!res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Resposta inesperada do servidor (não-JSON)");
        }
        return res.json() as Promise<{ path: string; content: string }>;
      })
      .then((data) => {
        setState({
          status: "success",
          content: data.content,
          loadedPath: selectedPath,
        });
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        const message =
          err instanceof TypeError || err instanceof SyntaxError
            ? "Não foi possível carregar o arquivo. Verifique se a API está em execução."
            : err instanceof Error
              ? err.message
              : "Erro desconhecido";
        setState({ status: "error", message, loadedPath: selectedPath });
      });

    return () => {
      controller.abort();
    };
  }, [selectedPath]);

  return state;
}
