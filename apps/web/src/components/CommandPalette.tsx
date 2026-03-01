import { useState, useEffect, useCallback } from "react";
import "./CommandPalette.css";

export interface CommandPalettePayload {
  command: string;
  context: string;
  params?: { userMessage?: string };
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (payload: CommandPalettePayload) => void;
  /** Currently selected text in the editor (empty string if none). */
  selectedText: string;
  /** Full document content — used as context when there is no selection. */
  content: string;
}

const COMMANDS = [
  { id: "summarize", label: "Summarize", description: "Summarise the selected text or document" },
  { id: "rewrite", label: "Rewrite", description: "Rewrite the selected text or document" },
  { id: "create-prd", label: "Create PRD", description: "Generate a PRD from the selected text or document" },
];

export function CommandPalette({
  isOpen,
  onClose,
  onExecute,
  selectedText,
  content,
}: CommandPaletteProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Reset selection when opened
  useEffect(() => {
    if (isOpen) setSelectedIdx(0);
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => (i + 1) % COMMANDS.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => (i - 1 + COMMANDS.length) % COMMANDS.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = COMMANDS[selectedIdx];
        if (cmd) {
          onExecute({ command: cmd.id, context: selectedText || content });
          onClose();
        }
      }
    },
    [isOpen, onClose, onExecute, selectedIdx, selectedText, content]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const context = selectedText || content;
  const contextHint = selectedText
    ? `Using selection (${selectedText.length} chars)`
    : `Using full document (${content.length} chars)`;

  return (
    <div className="cmd-backdrop" onClick={onClose}>
      <div
        className="cmd-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        <div className="cmd-header">
          <span className="cmd-title">Commands</span>
          <span className="cmd-context-hint">{contextHint}</span>
        </div>
        <ul className="cmd-list" role="listbox">
          {COMMANDS.map((cmd, idx) => (
            <li
              key={cmd.id}
              role="option"
              aria-selected={idx === selectedIdx}
              className={`cmd-item${idx === selectedIdx ? " cmd-item--selected" : ""}`}
              onMouseEnter={() => setSelectedIdx(idx)}
              onClick={() => {
                onExecute({ command: cmd.id, context });
                onClose();
              }}
            >
              <span className="cmd-item__label">{cmd.label}</span>
              <span className="cmd-item__desc">{cmd.description}</span>
            </li>
          ))}
        </ul>
        <div className="cmd-footer">
          <kbd>↑↓</kbd> Navigate &nbsp; <kbd>Enter</kbd> Execute &nbsp; <kbd>Esc</kbd> Close
        </div>
      </div>
    </div>
  );
}
