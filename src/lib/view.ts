import type { AlertType, StageVisualStatus } from "./rules";

export type StageChangeVM = {
  id: string;
  field: string;
  oldDate: string;
  newDate: string;
  reason: string;
  actorAr: string;
  actorEn: string;
  seenAt: string | null;
  createdAt: string;
};

export type StageVM = {
  progressId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
  baselineStart: string;
  baselineDue: string;
  plannedStart: string;
  plannedDue: string;
  actualStart: string | null;
  completedAt: string | null;
  isCurrent: boolean;
  status: StageVisualStatus;
  daysLate: number;
  daysRemaining: number;
  changed: boolean;
  changes: StageChangeVM[];
};

export type AdjustmentVM = {
  id: string;
  delta: string;
  effectiveDate: string;
  reason: string | null;
  actorAr: string;
  actorEn: string;
  createdAt: string;
};

export type FundingTrancheVM = {
  id: string;
  sequence: number;
  sentAt: string;
  amount: string;
  note: string | null;
};

export type AssignmentVM = {
  id: string;
  departmentId: string;
  departmentAr: string;
  departmentEn: string;
  approvedAmount: string;
  currentAmount: string;
  delta: string;
  approvalStart: string | null;
  approvalEnd: string | null;
  modifiedStart: string | null;
  modifiedEnd: string | null;
  adjustments: AdjustmentVM[];
  fundingTranches: FundingTrancheVM[];
  stages: StageVM[];
  status: StageVisualStatus;
};

export type OperationDetail = {
  id: string;
  nameAr: string;
  nameEn: string;
  typeAr: string;
  typeEn: string;
  typeId: string;
  approvalDate: string;
  creatorAr: string;
  creatorEn: string;
  createdAt: string;
  assignments: AssignmentVM[];
  status: StageVisualStatus;
};

export type OperationListItem = {
  id: string;
  nameAr: string;
  nameEn: string;
  typeAr: string;
  typeEn: string;
  approvalDate: string;
  status: StageVisualStatus;
  departmentCount: number;
  amount: string;
  departmentsAr: string;
  departmentsEn: string;
};

export type AlertRow = {
  id: string;
  type: AlertType;
  operationId: string;
  operationAr: string;
  operationEn: string;
  operationTypeAr: string;
  operationTypeEn: string;
  departmentId: string;
  departmentAr: string;
  departmentEn: string;
  stageAr: string;
  stageEn: string;
  stageCode: string;
  plannedStart: string;
  plannedDue: string;
  approvalDate: string;
  daysLate: number;
  daysRemaining: number;
};

export type DeptStat = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  operations: number;
  overdueStages: number;
  status: StageVisualStatus | "idle";
};

export type ChartSlice = { key: string; labelAr: string; labelEn: string; value: number; tone: string };
export type ChartBar = { id: string; labelAr: string; labelEn: string; value: number; secondary: number };

export type OverdueGroup = {
  departmentId: string;
  departmentAr: string;
  departmentEn: string;
  typeAr: string;
  typeEn: string;
  count: number;
  items: { operationId: string; operationAr: string; operationEn: string; daysLate: number }[];
};

export type RecentFeedItem = {
  kind: "overdue" | "new" | "revision";
  href: string;
  titleAr: string;
  titleEn: string;
  metaAr: string;
  metaEn: string;
  at: string;
};

export type DashboardData = {
  kpis: {
    activeOperations: number;
    delayedDepartments: number;
    alerts: number;
    finance: string;
    unseenRevisions: number;
  };
  alerts: AlertRow[];
  operations: OperationListItem[];
  departments: DeptStat[];
  charts: {
    status: ChartSlice[];
    types: ChartSlice[];
    alerts: ChartSlice[];
    departments: ChartBar[];
  };
  overdueGroups: OverdueGroup[];
  recentFeed: RecentFeedItem[];
  isSector: boolean;
};
