"use client";

import { createContext, useContext } from "react";
import { dictionaries, type Dictionary } from "./dictionaries";
import type { Locale } from "@/lib/text";

const LocaleContext = createContext<Locale>("ar");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const locale = useContext(LocaleContext);
  const d: Dictionary = dictionaries[locale];
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const name = (ar: string, en?: string | null) => (locale === "en" && en ? en : ar);
  return { locale, d, t, name, dir: locale === "ar" ? ("rtl" as const) : ("ltr" as const) };
}
