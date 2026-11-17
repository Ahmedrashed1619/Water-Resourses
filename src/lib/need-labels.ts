import type { Locale } from "./text";

const statuses: Record<string, { ar: string; en: string }> = {
  SUBMITTED: { ar: "مُقدَّم", en: "Submitted" },
  UNDER_REVIEW: { ar: "قيد المراجعة", en: "Under review" },
  APPROVED: { ar: "موافق عليه", en: "Approved" },
  PARTIALLY_APPROVED: { ar: "موافقة جزئية", en: "Partially approved" },
  REJECTED: { ar: "مرفوض", en: "Rejected" },
  FULFILLED: { ar: "مُنفَّذ", en: "Fulfilled" },
};

const support: Record<string, { ar: string; en: string }> = {
  FINANCIAL: { ar: "دعم مالي", en: "Financial" },
  TECHNICAL: { ar: "دعم فني", en: "Technical" },
  BOTH: { ar: "مالي وفني", en: "Financial & technical" },
};

export function needStatusLabel(locale: Locale, status: string) {
  const row = statuses[status];
  return row ? (locale === "ar" ? row.ar : row.en) : status;
}

export function needSupportLabel(locale: Locale, value: string) {
  const row = support[value];
  return row ? (locale === "ar" ? row.ar : row.en) : value;
}
