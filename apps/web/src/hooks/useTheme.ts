import { useState, useEffect } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "evennotes-theme";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage not available
  }
  // Default: follow OS preference
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Manages light/dark theme.
 * - Reads initial value from localStorage (key: "evennotes-theme").
 * - Applies `data-theme` attribute to `document.documentElement`.
 * - Writes preference to localStorage on change.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return [theme, toggleTheme];
}
