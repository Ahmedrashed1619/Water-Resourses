import { diffDays } from "./dates";
import type { Role } from "./permissions";
import { isDepartmentRole, isSectorRole, rankOf } from "./permissions";

/** Derived (operation × department) status — never stored. */
export type DerivedOpStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "LATE"
  | "COMPLETED_ON_TIME"
  | "COMPLETED_LATE";

export type StageStatusInput = {
  plannedStart: string;
  plannedDue: string;
  actualStart: string | null;
  completedAt: string | null;
};

export function deriveOperationDepartmentStatus(stages: StageStatusInput[], today: string): DerivedOpStatus {
  if (!stages.length) return "NOT_STARTED";
  const allCompleted = stages.every((stage) => Boolean(stage.completedAt));
  if (allCompleted) {
    const anyLateFinish = stages.some((stage) => {
      if (!stage.completedAt) return false;
      return diffDays(stage.plannedDue, stage.completedAt) > 0;
    });
    return anyLateFinish ? "COMPLETED_LATE" : "COMPLETED_ON_TIME";
  }
  const anyStarted = stages.some((stage) => Boolean(stage.actualStart) || Boolean(stage.completedAt));
  const anyLate = stages.some((stage) => {
    if (stage.completedAt) return false;
    return diffDays(stage.plannedDue, today) > 0;
  });
  if (anyLate) return "LATE";
  if (!anyStarted) return "NOT_STARTED";
  return "IN_PROGRESS";
}

export function derivedStatusLabel(locale: "ar" | "en", status: DerivedOpStatus): string {
  const ar: Record<DerivedOpStatus, string> = {
    NOT_STARTED: "لم تبدأ بعد",
    IN_PROGRESS: "جارية التنفيذ",
    LATE: "متأخرة",
    COMPLETED_ON_TIME: "منتهية في الموعد",
    COMPLETED_LATE: "منتهية بتأخير",
  };
  const en: Record<DerivedOpStatus, string> = {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    LATE: "Late",
    COMPLETED_ON_TIME: "Completed on time",
    COMPLETED_LATE: "Completed late",
  };
  return locale === "ar" ? ar[status] : en[status];
}

/** Finished bucket for SSA filter «المنتهية». */
export function isCompletedDerived(status: DerivedOpStatus): boolean {
  return status === "COMPLETED_ON_TIME" || status === "COMPLETED_LATE";
}

export function defaultDerivedStatusFilter(role: string): DerivedOpStatus[] {
  return ["LATE", "IN_PROGRESS"];
}

export function statusFilterOptionsForRole(role: string): { value: string; ar: string; en: string }[] {
  const completedBoth = { value: "FINISHED", ar: "المنتهية", en: "Finished" };
  const onTime = { value: "COMPLETED_ON_TIME", ar: "منتهية في الموعد", en: "Completed on time" };
  const late = { value: "LATE", ar: "متأخرة", en: "Late" };
  const inProgress = { value: "IN_PROGRESS", ar: "جارية التنفيذ", en: "In progress" };
  const notStarted = { value: "NOT_STARTED", ar: "لم تبدأ بعد", en: "Not started" };
  const completedLate = { value: "COMPLETED_LATE", ar: "منتهية بتأخير", en: "Completed late" };

  if (isSectorRole(role) && rankOf(role) === "SUPER_ADMIN") {
    return [inProgress, completedBoth, late];
  }
  if (isSectorRole(role)) {
    return [onTime, late, inProgress, notStarted, completedLate];
  }
  if (isDepartmentRole(role)) {
    return [notStarted, inProgress, late, onTime, completedLate];
  }
  return [late, inProgress, notStarted, onTime, completedLate];
}

export function matchesStatusFilter(status: DerivedOpStatus, filter: string | undefined): boolean {
  if (!filter) return true;
  if (filter === "FINISHED") return isCompletedDerived(status);
  return status === filter;
}

/** Map legacy visual status used in older UI chips when needed. */
export function derivedToLegacyChip(status: DerivedOpStatus): "overdue" | "on_track" | "pending" | "completed" {
  if (status === "LATE") return "overdue";
  if (status === "NOT_STARTED") return "pending";
  if (status === "COMPLETED_ON_TIME" || status === "COMPLETED_LATE") return "completed";
  return "on_track";
}

export function roleUsesSectorStatusSet(role: Role | string): boolean {
  return isSectorRole(role);
}
