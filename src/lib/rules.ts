import { addDays, addMonths, diffDays } from "./dates";

export type StageAnchor = "APPROVAL" | "FINANCIAL_OPENING";

export type StageRule = {
  code: string;
  nameAr?: string;
  nameEn?: string;
  sortOrder: number;
  durationMonths: number;
  durationDays: number;
  anchor: StageAnchor | string;
};

export type StageWindow = {
  code: string;
  start: string;
  due: string;
};

function shift(iso: string, months: number, days: number): string {
  let next = iso;
  if (months) next = addMonths(next, months);
  if (days) next = addDays(next, days);
  return next;
}

export function computeStageWindows(approvalIso: string, rules: StageRule[]): StageWindow[] {
  const ordered = [...rules].sort((a, b) => a.sortOrder - b.sortOrder);
  const windows = new Map<string, StageWindow>();

  for (const rule of ordered) {
    if (rule.anchor === "FINANCIAL_OPENING") continue;
    windows.set(rule.code, {
      code: rule.code,
      start: approvalIso,
      due: shift(approvalIso, rule.durationMonths, rule.durationDays),
    });
  }

  const financial = windows.get("FINANCIAL_OPENING");
  const fallbackDue = [...windows.values()].map((item) => item.due).sort().at(-1) ?? approvalIso;
  const openingDue = financial?.due ?? fallbackDue;

  for (const rule of ordered) {
    if (rule.anchor !== "FINANCIAL_OPENING") continue;
    windows.set(rule.code, {
      code: rule.code,
      start: openingDue,
      due: shift(openingDue, rule.durationMonths, rule.durationDays),
    });
  }

  return ordered.map((rule) => windows.get(rule.code)).filter((item): item is StageWindow => Boolean(item));
}

export type AlertType = "OVERDUE" | "HALFWAY" | "DUE_SOON";

export function evaluateAlertTypes(
  input: { start: string; due: string; completed: boolean },
  today: string,
): AlertType[] {
  if (input.completed) return [];
  if (diffDays(input.due, today) > 0) return ["OVERDUE"];

  const alerts: AlertType[] = [];
  const remaining = diffDays(today, input.due);
  if (remaining >= 0 && remaining <= 5) alerts.push("DUE_SOON");

  const span = diffDays(input.start, input.due);
  if (span > 0 && remaining > 0) {
    const halfway = addDays(input.start, Math.ceil(span / 2));
    if (diffDays(halfway, today) >= 0) alerts.push("HALFWAY");
  }
  return alerts;
}

export type StageVisualStatus = "completed" | "overdue" | "due_soon" | "halfway" | "on_track" | "pending";

export function stageVisualStatus(
  input: { start: string; due: string; completed: boolean },
  today: string,
): StageVisualStatus {
  if (input.completed) return "completed";
  const kinds = evaluateAlertTypes(input, today);
  if (kinds.includes("OVERDUE")) return "overdue";
  if (kinds.includes("DUE_SOON")) return "due_soon";
  if (kinds.includes("HALFWAY")) return "halfway";
  if (diffDays(input.start, today) >= 0) return "on_track";
  return "pending";
}

const STATUS_RANK: Record<StageVisualStatus, number> = {
  overdue: 6,
  due_soon: 5,
  halfway: 4,
  on_track: 3,
  pending: 2,
  completed: 1,
};

export function worstStatus(statuses: StageVisualStatus[]): StageVisualStatus {
  if (!statuses.length) return "pending";
  return statuses.reduce((worst, current) => (STATUS_RANK[current] > STATUS_RANK[worst] ? current : worst));
}
