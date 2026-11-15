import { parseISODate } from "./dates";
import type { Locale } from "./text";

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function formatLongDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseISODate(iso));
}

export function formatStamp(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(new Date(iso));
}

export function daysPhrase(locale: Locale, value: number) {
  const abs = Math.abs(value);
  if (locale === "en") return `${abs} day${abs === 1 ? "" : "s"}`;
  if (abs === 1) return "يوم واحد";
  if (abs === 2) return "يومان";
  if (abs <= 10) return `${abs} أيام`;
  return `${abs} يومًا`;
}
