"use client";

import { createContext, useContext, useState } from "react";
import { translate, type Locale } from "@/lib/i18n/dictionary";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
} | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  function setLocale(next: Locale) {
    setLocaleState(next);
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

export function useTranslation() {
  const { locale } = useLocale();
  return {
    t: (key: string, params?: Record<string, string | number>) => translate(key, locale, params),
    locale,
  };
}
