import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import "./MarkdownEditor.css";

export interface MarkdownEditorHandle {
  /** Replace the current selection with `text`. If nothing is selected, inserts at cursor. */
  replaceSelection(text: string): void;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (selected: string) => void;
  /** Active theme — drives CodeMirror colour scheme. */
  theme?: "light" | "dark";
}

function buildThemeExtension(theme: "light" | "dark") {
  const isDark = theme === "dark";
  return EditorView.theme(
    {
      "&": { height: "100%" },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily:
          "var(--font-mono, 'JetBrains Mono', 'Fira Code', monospace)",
        fontSize: "14px",
        lineHeight: "1.6",
        background: isDark ? "#1a1a1a" : "#ffffff",
      },
      ".cm-content": {
        padding: "16px 16px 16px 12px",
        color: isDark ? "#e5e5e5" : "#1a1a1a",
        caretColor: isDark ? "#ffffff" : "#000000",
      },
      ".cm-line": { padding: "0" },
      ".cm-focused": { outline: "none" },
      ".cm-selectionBackground": {
        background: isDark
          ? "rgba(96, 165, 250, 0.3) !important"
          : "rgba(37, 99, 235, 0.15) !important",
      },
      "&.cm-focused .cm-selectionBackground": {
        background: isDark
          ? "rgba(96, 165, 250, 0.35) !important"
          : "rgba(37, 99, 235, 0.2) !important",
      },
    },
    { dark: isDark }
  );
}

export const MarkdownEditor = forwardRef<
  MarkdownEditorHandle,
  MarkdownEditorProps
>(function MarkdownEditor(
  { value, onChange, onSelectionChange, theme = "light" },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const themeRef = useRef(theme);
  const themeCompartmentRef = useRef(new Compartment());

  // Keep callback refs up to date without recreating the editor
  onChangeRef.current = onChange;
  onSelectionChangeRef.current = onSelectionChange;
  themeRef.current = theme;

  // Expose imperative handle for replacing selection from outside
  useImperativeHandle(ref, () => ({
    replaceSelection(text: string) {
      const view = viewRef.current;
      if (!view) return;
      const sel = view.state.selection.main;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: text },
        selection: { anchor: sel.from + text.length },
      });
      view.focus();
    },
  }));

  // Mount editor once
  useEffect(() => {
    if (!containerRef.current) return;

    const themeCompartment = themeCompartmentRef.current;

    const state = EditorState.create({
      doc: value,
      extensions: [
        markdown(),
        themeCompartment.of(buildThemeExtension(themeRef.current)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
          if (update.selectionSet) {
            const sel = update.state.selection.main;
            const selected = sel.empty
              ? ""
              : update.state.doc.sliceString(sel.from, sel.to);
            onSelectionChangeRef.current?.(selected);
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes (e.g. loading a file)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  // Reconfigure theme without recreating the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: themeCompartmentRef.current.reconfigure(
        buildThemeExtension(theme)
      ),
    });
  }, [theme]);

  return <div ref={containerRef} className="markdown-editor" />;
});
