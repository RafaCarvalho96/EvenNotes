import { useEffect } from "react";
import { useCommandRun } from "../hooks/useCommandRun";
import type { RunStatus } from "../hooks/useCommandRun";
import "./RunPanel.css";

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
  /** Called when the run ends with an error (including cancel). */
  onError?: (msg: string) => void;
  /** Called when user closes the panel. */
  onClose?: () => void;
}

export function RunPanel({ command, context, target, onResult, onError, onClose }: RunPanelProps) {
  const { status, output, errorMessage, cancel } = useCommandRun(command, target, context, onResult);

  useEffect(() => {
    if (status === "error") {
      onError?.(errorMessage || "Run failed");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="run-panel">
      <div className="run-panel__header">
        <ExecutionStatus status={status} command={command} />
        <div className="run-panel__header-actions">
          {status === "running" && (
            <button className="run-btn run-btn--cancel" onClick={cancel}>
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
