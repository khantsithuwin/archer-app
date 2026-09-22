import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyTheme, resolveTheme, type Theme } from "./core";

const STORAGE_KEY = "archer_theme";
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

function getInitialTheme(): Theme {
  return resolveTheme(
    localStorage.getItem(STORAGE_KEY),
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(document.documentElement, theme);
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "dark" ? "#0e1c20" : "#f8faf9",
    );
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light"),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
