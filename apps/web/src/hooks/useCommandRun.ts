import { useState, useEffect, useRef } from "react";

export type RunStatus = "idle" | "running" | "success" | "error";

interface RunTarget {
  type: "file";
  path: string;
}

export function useCommandRun(
  command: string,
  target: RunTarget,
  context: string,
  onResult?: (result: string) => void,
) {
  const [status, setStatus] = useState<RunStatus>("idle");
  const [output, setOutput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const outputRef = useRef(output);
  outputRef.current = output;
  const statusRef = useRef<RunStatus>("idle");
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function startRun() {
      setStatus("running");
      statusRef.current = "running";
      setOutput("");
      setErrorMessage("");

      try {
        const res = await fetch("/api/commands/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command, target, params: { context } }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`POST /api/commands/run returned ${res.status}`);
        }

        const data = (await res.json()) as { runId?: string; id?: string };
        const runId = data.runId ?? data.id;
        if (!runId) throw new Error("No runId in response");
        if (cancelled) return;

        const es = new EventSource(`/api/runs/${runId}/events`);
        esRef.current = es;

        es.addEventListener("run.token_stream", (e: MessageEvent) => {
          if (cancelled) return;
          try {
            const event = JSON.parse(e.data) as { payload?: { token?: string } };
            const token = event.payload?.token;
            if (token) setOutput((prev) => prev + token);
          } catch {
            setOutput((prev) => prev + e.data);
          }
        });

        es.addEventListener("run.completed", (e: MessageEvent) => {
          es.close();
          if (cancelled) return;
          let finalOutput = outputRef.current;
          try {
            const event = JSON.parse(e.data) as { payload?: { output?: string; result?: string } };
            const payloadOutput = event.payload?.output ?? event.payload?.result;
            if (payloadOutput) {
              finalOutput = payloadOutput;
              setOutput(finalOutput);
            }
          } catch {
            // keep accumulated tokens
          }
          statusRef.current = "success";
          setStatus("success");
          onResult?.(finalOutput);
        });

        es.addEventListener("run.failed", (e: MessageEvent) => {
          es.close();
          if (cancelled) return;
          let msg = "Run failed";
          try {
            const event = JSON.parse(e.data) as { payload?: { error?: string; message?: string } };
            msg = event.payload?.error ?? event.payload?.message ?? msg;
          } catch {
            // ignore parse error
          }
          setErrorMessage(msg);
          statusRef.current = "error";
          setStatus("error");
        });

        es.onerror = () => {
          if (cancelled) return;
          if (statusRef.current !== "success" && statusRef.current !== "error") {
            es.close();
            setErrorMessage("Connection to event stream lost");
            statusRef.current = "error";
            setStatus("error");
          }
        };
      } catch (err) {
        if (!cancelled) {
          // Ignore AbortError from cleanup (e.g. React StrictMode double-invoke)
          if (err instanceof DOMException && err.name === "AbortError") return;
          setErrorMessage(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      }
    }

    void startRun();

    return () => {
      cancelled = true;
      controller.abort();
      esRef.current?.close();
      esRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = () => {
    esRef.current?.close();
    esRef.current = null;
    setStatus("error");
    setErrorMessage("Cancelled by user");
  };

  return { status, output, errorMessage, cancel };
}
