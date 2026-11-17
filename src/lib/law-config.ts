/** Configurable defaults aligned with Law 182/2018 & Reg. 692/2019 — soft warnings only. */

export const LAW_CONFIG = {
  /** Egyptian fiscal year: 1 July → 30 June */
  fiscalYearStartMonth: 7,
  fiscalYearStartDay: 1,
  /** Last month of FY (June) — contracting needs exceptional approval (L11) */
  fiscalYearLastMonth: 6,
  /** Min days Publication → Technical Opening for general tender (R46) */
  minPublicationToTechnicalDays: 20,
  /** Urgent general tender minimum (R46) */
  minPublicationToTechnicalUrgentDays: 14,
  /** Postponement of opening must be ≥ half the originally announced period (R47) */
  postponementMinFractionOfOriginal: 0.5,
} as const;

export type LawConfig = typeof LAW_CONFIG;
