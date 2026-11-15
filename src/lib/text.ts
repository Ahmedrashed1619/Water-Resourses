export type Locale = "ar" | "en";

export function tx(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

export function locName(locale: Locale, ar: string, en?: string | null) {
  return locale === "en" && en ? en : ar;
}
