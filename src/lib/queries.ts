import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { CurrentUser } from "./auth";
import { dateToIso, diffDays, todayISO } from "./dates";
import { addMoney } from "./money";
import { audienceFor, can, isDepartmentRole } from "./permissions";
import { stageVisualStatus, worstStatus, type AlertType, type StageVisualStatus } from "./rules";
import type { AlertRow, AssignmentVM, DashboardData, DeptStat, OperationDetail, OperationListItem, StageVM } from "./view";

const assignmentInclude = {
  department: true,
  adjustments: { include: { createdBy: true }, orderBy: { effectiveDate: "desc" as const } },
  progress: {
    include: {
      stageDefinition: true,
      dateChanges: { include: { createdBy: true }, orderBy: { createdAt: "desc" as const } },
    },
    orderBy: { stageDefinition: { sortOrder: "asc" as const } },
  },
} satisfies Prisma.OperationDepartmentInclude;

type AssignmentRow = Prisma.OperationDepartmentGetPayload<{ include: typeof assignmentInclude }>;

function assignmentWhere(user: CurrentUser): Prisma.OperationDepartmentWhereInput {
  if (isDepartmentRole(user.role)) {
    return { isDeleted: false, departmentId: user.departmentId ?? "__none__", operation: { isDeleted: false } };
  }
  return { isDeleted: false, operation: { isDeleted: false } };
}

function mapStage(row: AssignmentRow["progress"][number], today: string): StageVM {
  const plannedStart = dateToIso(row.plannedStart);
  const plannedDue = dateToIso(row.plannedDue);
  const baselineStart = dateToIso(row.baselineStart);
  const baselineDue = dateToIso(row.baselineDue);
  const remaining = diffDays(today, plannedDue);
  return {
    progressId: row.id,
    code: row.stageDefinition.code,
    nameAr: row.stageDefinition.nameAr,
    nameEn: row.stageDefinition.nameEn,
    sortOrder: row.stageDefinition.sortOrder,
    baselineStart,
    baselineDue,
    plannedStart,
    plannedDue,
    actualStart: row.actualStart ? dateToIso(row.actualStart) : null,
    completedAt: row.completedAt ? dateToIso(row.completedAt) : null,
    isCurrent: row.isCurrent,
    status: stageVisualStatus({ start: plannedStart, due: plannedDue, completed: Boolean(row.completedAt) }, today),
    daysLate: Math.max(0, diffDays(plannedDue, today)),
    daysRemaining: remaining,
    changed: baselineStart !== plannedStart || baselineDue !== plannedDue,
    changes: row.dateChanges.map((change) => ({
      id: change.id,
      field: change.field,
      oldDate: dateToIso(change.oldDate),
      newDate: dateToIso(change.newDate),
      reason: change.reason,
      actorAr: change.createdBy.nameAr,
      actorEn: change.createdBy.nameEn,
      seenAt: change.seenAt ? change.seenAt.toISOString() : null,
      createdAt: change.createdAt.toISOString(),
    })),
  };
}

function mapAssignment(row: AssignmentRow, today: string): AssignmentVM {
  const stages = row.progress.map((item) => mapStage(item, today));
  const delta = row.adjustments.reduce((sum, item) => addMoney(sum, item.deltaAmount), "0.00");
  return {
    id: row.id,
    departmentId: row.departmentId,
    departmentAr: row.department.nameAr,
    departmentEn: row.department.nameEn,
    approvedAmount: row.approvedAmount,
    currentAmount: addMoney(row.approvedAmount, delta),
    delta,
    approvalStart: row.approvalStart ? dateToIso(row.approvalStart) : null,
    approvalEnd: row.approvalEnd ? dateToIso(row.approvalEnd) : null,
    modifiedStart: row.modifiedStart ? dateToIso(row.modifiedStart) : null,
    modifiedEnd: row.modifiedEnd ? dateToIso(row.modifiedEnd) : null,
    adjustments: row.adjustments.map((item) => ({
      id: item.id,
      delta: item.deltaAmount,
      effectiveDate: dateToIso(item.effectiveDate),
      reason: item.reason,
      actorAr: item.createdBy.nameAr,
      actorEn: item.createdBy.nameEn,
      createdAt: item.createdAt.toISOString(),
    })),
    stages,
    status: worstStatus(stages.map((stage) => stage.status)),
  };
}

function toListItem(operation: {
  id: string;
  nameAr: string;
  nameEn: string;
  technicalApprovalDate: Date;
  operationType: { nameAr: string; nameEn: string };
  assignments: AssignmentRow[];
}, today: string): OperationListItem {
  const assignments = operation.assignments.map((item) => mapAssignment(item, today));
  const amount = assignments.reduce((sum, item) => addMoney(sum, item.currentAmount), "0.00");
  return {
    id: operation.id,
    nameAr: operation.nameAr,
    nameEn: operation.nameEn,
    typeAr: operation.operationType.nameAr,
    typeEn: operation.operationType.nameEn,
    approvalDate: dateToIso(operation.technicalApprovalDate),
    status: worstStatus(assignments.map((item) => item.status)),
    departmentCount: assignments.length,
    amount,
    departmentsAr: assignments.map((item) => item.departmentAr).join("، "),
    departmentsEn: assignments.map((item) => item.departmentEn).join(", "),
  };
}

const operationInclude = {
  operationType: true,
  createdBy: true,
  assignments: { include: assignmentInclude },
} satisfies Prisma.OperationInclude;

export async function getShellCounts(user: CurrentUser) {
  const audience = audienceFor(user.role);
  const [alerts, revisions] = await Promise.all([
    prisma.alert.count({
      where: {
        isDeleted: false,
        resolvedAt: null,
        audience,
        type: isDepartmentRole(user.role) ? { in: ["HALFWAY", "DUE_SOON"] } : "OVERDUE",
        progress: { operationDepartment: assignmentWhere(user) },
      },
    }),
    canSeeRevisions(user)
      ? prisma.stageDateChange.count({
          where: { seenAt: null, progress: { operationDepartment: { isDeleted: false, operation: { isDeleted: false } } } },
        })
      : Promise.resolve(0),
  ]);
  return { alerts, revisions };
}

function canSeeRevisions(user: CurrentUser) {
  return can(user, "revisions.view");
}

export async function listAlerts(
  user: CurrentUser,
  filter: { departmentId?: string; stageCode?: string } = {},
): Promise<AlertRow[]> {
  const today = todayISO();
  const departmentId = isDepartmentRole(user.role) ? user.departmentId ?? "__none__" : filter.departmentId;
  const alerts = await prisma.alert.findMany({
    where: {
      isDeleted: false,
      resolvedAt: null,
      audience: audienceFor(user.role),
      type: isDepartmentRole(user.role) ? { in: ["HALFWAY", "DUE_SOON"] } : "OVERDUE",
      progress: {
        ...(filter.stageCode ? { stageDefinition: { code: filter.stageCode } } : {}),
        operationDepartment: {
          isDeleted: false,
          operation: { isDeleted: false },
          ...(departmentId ? { departmentId } : {}),
        },
      },
    },
    include: {
      progress: {
        include: {
          stageDefinition: true,
          operationDepartment: { include: { department: true, operation: true } },
        },
      },
    },
  });
  return alerts
    .map((alert) => {
      const start = dateToIso(alert.progress.plannedStart);
      const due = dateToIso(alert.progress.plannedDue);
      return {
        id: alert.id,
        type: alert.type as AlertType,
        operationId: alert.progress.operationDepartment.operationId,
        operationAr: alert.progress.operationDepartment.operation.nameAr,
        operationEn: alert.progress.operationDepartment.operation.nameEn,
        departmentId: alert.progress.operationDepartment.departmentId,
        departmentAr: alert.progress.operationDepartment.department.nameAr,
        departmentEn: alert.progress.operationDepartment.department.nameEn,
        stageAr: alert.progress.stageDefinition.nameAr,
        stageEn: alert.progress.stageDefinition.nameEn,
        stageCode: alert.progress.stageDefinition.code,
        plannedStart: start,
        plannedDue: due,
        approvalDate: dateToIso(alert.progress.operationDepartment.operation.technicalApprovalDate),
        daysLate: Math.max(0, diffDays(due, today)),
        daysRemaining: diffDays(today, due),
      };
    })
    .sort((a, b) => b.daysLate - a.daysLate || a.departmentAr.localeCompare(b.departmentAr, "ar"));
}

export async function listOperations(
  user: CurrentUser,
  filter: { q?: string; typeId?: string; departmentId?: string; status?: string },
) {
  const today = todayISO();
  const departmentId = isDepartmentRole(user.role) ? user.departmentId ?? "__none__" : filter.departmentId;
  const operations = await prisma.operation.findMany({
    where: {
      isDeleted: false,
      ...(filter.typeId ? { operationTypeId: filter.typeId } : {}),
      ...(filter.q
        ? { OR: [{ nameAr: { contains: filter.q } }, { nameEn: { contains: filter.q } }] }
        : {}),
      assignments: {
        some: {
          isDeleted: false,
          ...(departmentId ? { departmentId } : {}),
        },
      },
    },
    include: {
      operationType: true,
      assignments: {
        where: { isDeleted: false, ...(isDepartmentRole(user.role) ? { departmentId: user.departmentId ?? "__none__" } : {}) },
        include: assignmentInclude,
      },
    },
    orderBy: { technicalApprovalDate: "desc" },
  });
  let items = operations.map((operation) => toListItem(operation, today));
  if (filter.status) items = items.filter((item) => item.status === filter.status);
  return items;
}

export async function getOperation(user: CurrentUser, id: string): Promise<OperationDetail | null> {
  const today = todayISO();
  const operation = await prisma.operation.findFirst({
    where: {
      id,
      isDeleted: false,
      assignments: { some: assignmentWhere(user) },
    },
    include: {
      ...operationInclude,
      assignments: {
        where: isDepartmentRole(user.role) ? { isDeleted: false, departmentId: user.departmentId ?? "__none__" } : { isDeleted: false },
        include: assignmentInclude,
        orderBy: { department: { sortOrder: "asc" } },
      },
    },
  });
  if (!operation || operation.assignments.length === 0) return null;
  const assignments = operation.assignments.map((item) => mapAssignment(item, today));
  return {
    id: operation.id,
    nameAr: operation.nameAr,
    nameEn: operation.nameEn,
    typeAr: operation.operationType.nameAr,
    typeEn: operation.operationType.nameEn,
    typeId: operation.operationTypeId,
    approvalDate: dateToIso(operation.technicalApprovalDate),
    creatorAr: operation.createdBy.nameAr,
    creatorEn: operation.createdBy.nameEn,
    createdAt: operation.createdAt.toISOString(),
    assignments,
    status: worstStatus(assignments.map((item) => item.status)),
  };
}

export async function getDashboard(user: CurrentUser): Promise<DashboardData> {
  const today = todayISO();
  const [operations, alerts, departments, unseenRevisions] = await Promise.all([
    prisma.operation.findMany({
      where: { isDeleted: false, assignments: { some: assignmentWhere(user) } },
      include: {
        operationType: true,
        assignments: {
          where: isDepartmentRole(user.role) ? { isDeleted: false, departmentId: user.departmentId ?? "__none__" } : { isDeleted: false },
          include: assignmentInclude,
        },
      },
      orderBy: { technicalApprovalDate: "desc" },
    }),
    listAlerts(user),
    isDepartmentRole(user.role) ? Promise.resolve([]) : prisma.department.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    canSeeRevisions(user)
      ? prisma.stageDateChange.count({ where: { seenAt: null, progress: { operationDepartment: { isDeleted: false, operation: { isDeleted: false } } } } })
      : Promise.resolve(0),
  ]);
  const items = operations.map((operation) => toListItem(operation, today));
  const finance = items.reduce((sum, item) => addMoney(sum, item.amount), "0.00");
  const delayed = new Set<string>();
  const byDepartment = new Map<string, { operations: number; statuses: StageVisualStatus[]; overdueStages: number }>();
  for (const operation of operations) {
    for (const assignment of operation.assignments) {
      const mapped = mapAssignment(assignment, today);
      const bucket = byDepartment.get(mapped.departmentId) ?? { operations: 0, statuses: [], overdueStages: 0 };
      bucket.operations += 1;
      bucket.statuses.push(mapped.status);
      bucket.overdueStages += mapped.stages.filter((stage) => stage.status === "overdue").length;
      if (mapped.stages.some((stage) => stage.status === "overdue")) delayed.add(mapped.departmentId);
      byDepartment.set(mapped.departmentId, bucket);
    }
  }
  const directory: DeptStat[] = departments.map((department) => {
    const bucket = byDepartment.get(department.id);
    if (!bucket) {
      return { id: department.id, code: department.code, nameAr: department.nameAr, nameEn: department.nameEn, operations: 0, overdueStages: 0, status: "idle" };
    }
    return {
      id: department.id,
      code: department.code,
      nameAr: department.nameAr,
      nameEn: department.nameEn,
      operations: bucket.operations,
      overdueStages: bucket.overdueStages,
      status: worstStatus(bucket.statuses),
    };
  });
  return {
    kpis: {
      activeOperations: items.filter((item) => item.status !== "completed").length,
      delayedDepartments: delayed.size,
      alerts: alerts.length,
      finance,
      unseenRevisions,
    },
    alerts: alerts.slice(0, 6),
    operations: items.slice(0, 6),
    departments: directory,
  };
}

export async function listFinanceRows(user: CurrentUser) {
  const today = todayISO();
  const rows = await prisma.operationDepartment.findMany({
    where: assignmentWhere(user),
    include: { ...assignmentInclude, operation: true },
    orderBy: [{ operation: { technicalApprovalDate: "desc" } }, { department: { sortOrder: "asc" } }],
  });
  return rows.map((row) => ({
    assignment: mapAssignment(row, today),
    operationId: row.operation.id,
    operationAr: row.operation.nameAr,
    operationEn: row.operation.nameEn,
    approvalDate: dateToIso(row.operation.technicalApprovalDate),
  }));
}

export async function listRevisions() {
  const rows = await prisma.stageDateChange.findMany({
    where: { progress: { operationDepartment: { isDeleted: false, operation: { isDeleted: false } } } },
    include: {
      createdBy: true,
      progress: {
        include: {
          stageDefinition: true,
          operationDepartment: { include: { department: true, operation: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map((row) => ({
    id: row.id,
    field: row.field,
    oldDate: dateToIso(row.oldDate),
    newDate: dateToIso(row.newDate),
    reason: row.reason,
    seenAt: row.seenAt ? row.seenAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    actorAr: row.createdBy.nameAr,
    actorEn: row.createdBy.nameEn,
    stageAr: row.progress.stageDefinition.nameAr,
    stageEn: row.progress.stageDefinition.nameEn,
    departmentAr: row.progress.operationDepartment.department.nameAr,
    departmentEn: row.progress.operationDepartment.department.nameEn,
    operationId: row.progress.operationDepartment.operationId,
    operationAr: row.progress.operationDepartment.operation.nameAr,
    operationEn: row.progress.operationDepartment.operation.nameEn,
  }));
}

export async function listUsers(user: CurrentUser) {
  return prisma.user.findMany({
    where: isDepartmentRole(user.role)
      ? { departmentId: user.departmentId ?? "__none__" }
      : { role: { in: ["SECTOR_SUPER_ADMIN", "SECTOR_ADMIN", "SECTOR_EMPLOYEE", "SUPER_ADMIN", "SECTOR"] } },
    include: { department: true },
    orderBy: [{ role: "asc" }, { nameAr: "asc" }],
  });
}

export async function listDirectory() {
  return prisma.department.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}

export async function getDepartmentDetail(id: string) {
  const today = todayISO();
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      users: { orderBy: { nameAr: "asc" } },
      assignments: {
        where: { isDeleted: false, operation: { isDeleted: false } },
        include: { ...assignmentInclude, operation: { include: { operationType: true } } },
      },
    },
  });
  if (!department) return null;
  return {
    department,
    assignments: department.assignments.map((row) => ({
      assignment: mapAssignment(row, today),
      operationId: row.operation.id,
      operationAr: row.operation.nameAr,
      operationEn: row.operation.nameEn,
      typeAr: row.operation.operationType.nameAr,
      typeEn: row.operation.operationType.nameEn,
      approvalDate: dateToIso(row.operation.technicalApprovalDate),
    })),
  };
}

export async function listTypes() {
  return prisma.operationType.findMany({
    include: { stages: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listAudit() {
  return prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 120,
  });
}

export async function filterOptions() {
  const [types, departments] = await Promise.all([
    prisma.operationType.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return { types, departments };
}
