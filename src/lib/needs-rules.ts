import { LAW_CONFIG } from "./law-config";

export type SoftWarning = { code: string; ar: string; en: string };

/** Fiscal year containing `iso` (YYYY-MM-DD), starting 1 July. */
export function fiscalYearOf(iso: string): { start: string; end: string; label: string } {
  const [y, m] = iso.split("-").map(Number);
  const startYear = m >= LAW_CONFIG.fiscalYearStartMonth ? y : y - 1;
  const endYear = startYear + 1;
  return {
    start: `${startYear}-${String(LAW_CONFIG.fiscalYearStartMonth).padStart(2, "0")}-01`,
    end: `${endYear}-${String(LAW_CONFIG.fiscalYearLastMonth).padStart(2, "0")}-30`,
    label: `${startYear}/${endYear}`,
  };
}

export function isLastMonthOfFiscalYear(iso: string): boolean {
  const month = Number(iso.slice(5, 7));
  return month === LAW_CONFIG.fiscalYearLastMonth;
}

export function warnDesiredStartInLastFyMonth(desiredStartIso: string | null | undefined): SoftWarning | null {
  if (!desiredStartIso) return null;
  if (!isLastMonthOfFiscalYear(desiredStartIso)) return null;
  return {
    code: "FY_LAST_MONTH",
    ar: "تنبيه: التعاقد في الشهر الأخير من السنة المالية يتطلب موافقة استثنائية (م 11)",
    en: "Warning: contracting in the last month of the fiscal year needs exceptional approval (Art. 11)",
  };
}

export function warnSimilarNeedRequest(hasSimilarInSameFy: boolean): SoftWarning | null {
  if (!hasSimilarInSameFy) return null;
  return {
    code: "SIMILAR_REQUEST",
    ar: "تنبيه: يوجد طلب مشابه؛ يُحظر تجزئة محل العقد للتحايل على الإجراءات (م 10)",
    en: "Warning: a similar request exists; splitting the contract to evade procedures is prohibited (Art. 10)",
  };
}

export function warnPublicationToTechnicalGap(publicationIso: string, technicalIso: string): SoftWarning | null {
  const days = Math.round((Date.parse(technicalIso) - Date.parse(publicationIso)) / 86_400_000);
  if (days >= LAW_CONFIG.minPublicationToTechnicalDays) return null;
  return {
    code: "PUB_TECH_GAP",
    ar: `تنبيه: المدة بين النشر والفتح الفني (${days} يومًا) أقل من ${LAW_CONFIG.minPublicationToTechnicalDays} يومًا (اللائحة م 46)`,
    en: `Warning: days between publication and technical opening (${days}) are under ${LAW_CONFIG.minPublicationToTechnicalDays} (Reg. Art. 46)`,
  };
}

export function warnTechnicalOpeningPostponement(
  originalSpanDays: number,
  postponementDays: number,
): SoftWarning | null {
  if (originalSpanDays <= 0 || postponementDays <= 0) return null;
  const min = Math.ceil(originalSpanDays * LAW_CONFIG.postponementMinFractionOfOriginal);
  if (postponementDays >= min) return null;
  return {
    code: "POSTPONE_HALF",
    ar: `تنبيه: تأجيل الفتح الفني يجب ألا يقل عن نصف المدة المعلنة أصلاً (الحد الأدنى ${min} يومًا — اللائحة م 47)`,
    en: `Warning: postponing the technical opening must be at least half the original period (min ${min} days — Reg. Art. 47)`,
  };
}

export function collectNeedRequestWarnings(input: {
  desiredStartIso?: string | null;
  hasSimilarInSameFy: boolean;
}): SoftWarning[] {
  return [warnDesiredStartInLastFyMonth(input.desiredStartIso), warnSimilarNeedRequest(input.hasSimilarInSameFy)].filter(
    (item): item is SoftWarning => Boolean(item),
  );
}
