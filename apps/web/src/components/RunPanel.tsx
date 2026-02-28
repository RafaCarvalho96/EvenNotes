import { useState, useEffect, useRef } from "react";
import "./RunPanel.css";

export type RunStatus = "idle" | "running" | "success" | "error";

interface RunTarget {
  type: "file";
  path: string;
}

export interface RunPanelProps {
  /** Command id to execute (e.g. "summarize", "rewrite", "create-prd"). */
  command: string;
  /** Optional extra context passed as param (selected text or full doc). */
  context: string;
  /** Target file for the run. */
  target: RunTarget;
  /** Called with the final accumulated output when run succeeds. */
  onResult?: (result: string) => void;
  /** Called when user closes the panel. */
  onClose?: () => void;
}

export function RunPanel({
  command,
  context,
  target,
  onResult,
  onClose,
}: RunPanelProps) {
  const [status, setStatus] = useState<RunStatus>("idle");
  const [output, setOutput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const outputRef = useRef(output);
  outputRef.current = output;

  const esRef = useRef<EventSource | null>(null);

  // Start the run as soon as the component mounts
  useEffect(() => {
    let cancelled = false;

    async function startRun() {
      setStatus("running");
      setOutput("");
      setErrorMessage("");

      try {
        const res = await fetch("/api/commands/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command,
            target,
            params: { context },
          }),
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
            const payload = JSON.parse(e.data) as { token?: string };
            if (payload.token) {
              setOutput((prev) => prev + payload.token);
            }
          } catch {
            setOutput((prev) => prev + e.data);
          }
        });

        es.addEventListener("run.completed", (e: MessageEvent) => {
          es.close();
          if (cancelled) return;
          let finalOutput = outputRef.current;
          try {
            const payload = JSON.parse(e.data) as { output?: string; result?: string };
            if (payload.output || payload.result) {
              finalOutput = (payload.output ?? payload.result) as string;
              setOutput(finalOutput);
            }
          } catch {
            // keep accumulated tokens
          }
          setStatus("success");
          onResult?.(finalOutput);
        });

        es.addEventListener("run.failed", (e: MessageEvent) => {
          es.close();
          if (cancelled) return;
          let msg = "Run failed";
          try {
            const payload = JSON.parse(e.data) as { error?: string; message?: string };
            msg = payload.error ?? payload.message ?? msg;
          } catch {
            // ignore parse error
          }
          setErrorMessage(msg);
          setStatus("error");
        });

        es.onerror = () => {
          if (cancelled) return;
          if (status !== "success" && status !== "error") {
            es.close();
            setErrorMessage("Connection to event stream lost");
            setStatus("error");
          }
        };
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      }
    }

    void startRun();

    return () => {
      cancelled = true;
      esRef.current?.close();
      esRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = () => {
    esRef.current?.close();
    esRef.current = null;
    setStatus("error");
    setErrorMessage("Cancelled by user");
  };

  return (
    <div className="run-panel">
      <div className="run-panel__header">
        <ExecutionStatus status={status} command={command} />
        <div className="run-panel__header-actions">
          {status === "running" && (
            <button className="run-btn run-btn--cancel" onClick={handleCancel}>
              Cancel
            </button>
          )}
          {onClose && (
            <button className="run-btn run-btn--close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="run-panel__output">
        {output ? (
          <pre className="run-output">{output}</pre>
        ) : status === "running" ? (
          <span className="run-waiting">Waiting for output…</span>
        ) : null}
        {status === "error" && (
          <div className="run-error">
            {errorMessage || "An error occurred"}
          </div>
        )}
      </div>
    </div>
  );
}

interface ExecutionStatusProps {
  status: RunStatus;
  command: string;
}

export function ExecutionStatus({ status, command }: ExecutionStatusProps) {
  const labels: Record<RunStatus, string> = {
    idle: "Idle",
    running: "Running…",
    success: "Completed",
    error: "Failed",
  };

  return (
    <div className={`exec-status exec-status--${status}`}>
      <span className="exec-status__dot" aria-hidden="true" />
      <span className="exec-status__label">
        <strong>{command}</strong> &mdash; {labels[status]}
      </span>
    </div>
  );
}
