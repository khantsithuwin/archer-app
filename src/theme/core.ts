export type Theme = "light" | "dark";

export function resolveTheme(savedTheme: string | null, prefersDark: boolean): Theme {
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return prefersDark ? "dark" : "light";
}

type ThemeRoot = {
  dataset: { theme?: string };
  style: { colorScheme: string };
};

export function applyTheme(root: ThemeRoot, theme: Theme): void {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}
