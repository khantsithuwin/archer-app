import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type TranslationKey } from "./locales/en";
import { my } from "./locales/my";
import { myPhrases } from "./locales/phrases-my";

export type Locale = "en" | "my";
type Variables = Record<string, string | number>;
type I18nValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: TranslationKey, variables?: Variables) => string; tr: (english: string, variables?: Variables) => string };

const STORAGE_KEY = "archer_locale";
const dictionaries = { en, my };
const I18nContext = createContext<I18nValue | null>(null);

export function getLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "my") return saved;
  return navigator.language.toLowerCase().startsWith("my") ? "my" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getLocale);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo<I18nValue>(() => ({
    locale,
    setLocale,
    t: (key, variables = {}) => Object.entries(variables).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), dictionaries[locale][key]),
    tr: (english, variables = {}) => Object.entries(variables).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), locale === "my" ? myPhrases[english] ?? english : english),
  }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

const myEnums: Record<string, string> = {
  DRAFT: "မူကြမ်း", OPEN: "ဖွင့်ထားသည်", PAUSED: "ခေတ္တရပ်ထားသည်", CLOSED: "ပိတ်ထားသည်",
  IN_PROGRESS: "လုပ်ဆောင်နေသည်", COMPLETED: "ပြီးဆုံးသည်", PENDING: "စောင့်ဆိုင်းနေသည်",
  PENDING_ACCEPTANCE: "လက်ခံရန်စောင့်နေသည်", ACTIVE: "လုပ်ဆောင်ဆဲ", COMPLETION_REQUESTED: "ပြီးဆုံးရန်တောင်းဆိုထားသည်",
  CANCELLED: "ပယ်ဖျက်ထားသည်", DISPUTED: "အငြင်းပွားနေသည်", SUBMITTED: "ပို့ထားသည်",
  SHORTLISTED: "ရွေးချယ်စာရင်းဝင်", ACCEPTED: "လက်ခံထားသည်", REJECTED: "ငြင်းပယ်ထားသည်",
  WITHDRAWN: "ပြန်ရုပ်သိမ်းထားသည်", CHANGES_REQUESTED: "ပြင်ဆင်ရန်တောင်းဆိုထားသည်", APPROVED: "အတည်ပြုထားသည်",
  ENTRY: "အစပြု", INTERMEDIATE: "အလယ်အလတ်", EXPERT: "ကျွမ်းကျင်",
};

export function enumLabel(value: string, locale: Locale): string {
  return locale === "my" ? myEnums[value] ?? value.replaceAll("_", " ").toLowerCase() : value.replaceAll("_", " ").toLowerCase();
}
