export type Locale = "en" | "my";
export type Variables = Record<string, string | number>;

export function resolveLocale(savedLocale: string | null, browserLanguage: string): Locale {
  if (savedLocale === "en" || savedLocale === "my") return savedLocale;
  return browserLanguage.toLowerCase().startsWith("my") ? "my" : "en";
}

export function interpolate(text: string, variables: Variables = {}): string {
  return Object.entries(variables).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    text,
  );
}

export function firstGrapheme(value: string, locale: Locale): string {
  const text = value.trim();
  if (!text) return "";

  const segmenter = new Intl.Segmenter(locale, { granularity: "grapheme" });
  return segmenter.segment(text)[Symbol.iterator]().next().value?.segment ?? "";
}

type LocaleRoot = {
  lang: string;
  dir: string;
  dataset: { locale?: string };
};

export function applyDocumentLocale(root: LocaleRoot, locale: Locale): void {
  root.lang = locale;
  root.dir = "ltr";
  root.dataset.locale = locale;
}
