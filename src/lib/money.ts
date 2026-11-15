export function normalizeMoney(input: string): string | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const negative = trimmed.startsWith("-");
  const raw = negative ? trimmed.slice(1) : trimmed;
  const [whole, fraction = ""] = raw.split(".");
  return `${negative ? "-" : ""}${Number(whole)}.${(fraction + "00").slice(0, 2)}`;
}

function toCents(value: string): number {
  const negative = value.trim().startsWith("-");
  const raw = negative ? value.trim().slice(1) : value.trim();
  const [whole, fraction = ""] = raw.split(".");
  const cents = Math.abs(Number(whole)) * 100 + Number((fraction + "00").slice(0, 2));
  return negative ? -cents : cents;
}

export function addMoney(a: string, b: string): string {
  const cents = toCents(a) + toCents(b);
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function compareMoney(a: string, b: string): number {
  return toCents(a) - toCents(b);
}

export function formatMoney(value: string, locale: "ar" | "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}
