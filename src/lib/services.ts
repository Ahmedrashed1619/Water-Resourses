import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { CurrentUser } from "./auth";
import { parseISODate, dateToIso, todayISO, diffDays } from "./dates";
import { computeStageWindows, evaluateAlertTypes, type StageRule } from "./rules";
import { normalizeMoney, compareMoney } from "./money";
import { roleLabel } from "./labels";
import { can, canonicalRole, creatableRoles, isDepartmentRole, isPermission, rankOf } from "./permissions";

export class ActionError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

type Tx = Prisma.TransactionClient;

async function audit(
  tx: Tx | typeof prisma,
  userId: string,
  action: string,
  entity: string,
  entityId: string | null,
  summaryAr: string,
  summaryEn: string,
) {
  await tx.auditLog.create({
    data: { actorId: userId, action, entity, entityId, summaryAr, summaryEn },
  });
}

function assertManager(user: CurrentUser) {
  if (!can(user, "operations.manage")) throw new ActionError("forbidden");
}

function assertSectorActor(user: CurrentUser) {
  if (isDepartmentRole(user.role)) throw new ActionError("forbidden");
}

function assertOwnDepartment(user: CurrentUser, departmentId: string) {
  if (isDepartmentRole(user.role) && user.departmentId !== departmentId) throw new ActionError("forbidden");
}

function assertSameOrganization(actor: CurrentUser, target: { role: string; departmentId: string | null }) {
  if (isDepartmentRole(actor.role)) {
    if (!isDepartmentRole(target.role) || target.departmentId !== actor.departmentId) throw new ActionError("forbidden");
    if (rankOf(actor.role) === "ADMIN" && rankOf(target.role) !== "EMPLOYEE") throw new ActionError("forbidden");
    if (rankOf(actor.role) === "EMPLOYEE") throw new ActionError("forbidden");
    return;
  }
  if (isDepartmentRole(target.role)) throw new ActionError("forbidden");
  if (!can(actor, "users.manageAll") && rankOf(target.role) !== "EMPLOYEE") throw new ActionError("forbidden");
}

function dateOrNull(value: string | null | undefined) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ActionError("invalidDate");
  return parseISODate(value);
}

async function loadActiveStages(typeId: string) {
  const type = await prisma.operationType.findFirst({
    where: { id: typeId, isActive: true, deletedAt: null },
    include: { stages: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!type || type.stages.length === 0) throw new ActionError("invalid");
  return type;
}

function rulesOf(stages: { code: string; sortOrder: number; durationMonths: number; durationDays: number; anchor: string }[]): StageRule[] {
  return stages.map((stage) => ({
    code: stage.code,
    sortOrder: stage.sortOrder,
    durationMonths: stage.durationMonths,
    durationDays: stage.durationDays,
    anchor: stage.anchor,
  }));
}

async function writeProgress(tx: Tx, assignmentId: string, stages: Awaited<ReturnType<typeof loadActiveStages>>["stages"], approval: string) {
  const windows = computeStageWindows(approval, rulesOf(stages));
  const first = stages[0]?.id;
  for (const stage of stages) {
    const window = windows.find((item) => item.code === stage.code);
    if (!window) continue;
    await tx.departmentStageProgress.create({
      data: {
        operationDepartmentId: assignmentId,
        stageDefinitionId: stage.id,
        baselineStart: parseISODate(window.start),
        baselineDue: parseISODate(window.due),
        plannedStart: parseISODate(window.start),
        plannedDue: parseISODate(window.due),
        isCurrent: stage.id === first,
      },
    });
  }
}

export type DepartmentAssignmentInput = {
  departmentId: string;
  approvedAmount: string;
  approvalStart: string;
  approvalEnd: string;
};

function cleanAssignment(input: DepartmentAssignmentInput, approval: string) {
  const amount = input.approvedAmount.trim() ? normalizeMoney(input.approvedAmount) : "0.00";
  if (!amount || compareMoney(amount, "0.00") < 0) throw new ActionError("invalidAmount");
  const start = input.approvalStart || approval;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new ActionError("invalidDate");
  const end = input.approvalEnd || "";
  if (end && diffDays(start, end) < 0) throw new ActionError("dueBeforeStart");
  return { amount, start, end: end || null };
}

export async function createOperation(
  user: CurrentUser,
  input: {
    nameAr: string;
    nameEn: string;
    operationTypeId: string;
    technicalApprovalDate: string;
    departments: DepartmentAssignmentInput[];
  },
) {
  assertManager(user);
  const nameAr = input.nameAr.trim();
  if (nameAr.length < 3) throw new ActionError("nameRequired");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.technicalApprovalDate)) throw new ActionError("invalidDate");
  if (!input.departments.length) throw new ActionError("departmentRequired");
  const unique = new Set(input.departments.map((item) => item.departmentId));
  if (unique.size !== input.departments.length) throw new ActionError("invalid");
  if (isDepartmentRole(user.role) && [...unique].some((id) => id !== user.departmentId)) throw new ActionError("forbidden");
  const type = await loadActiveStages(input.operationTypeId);
  const departments = await prisma.department.findMany({ where: { id: { in: [...unique] }, isActive: true } });
  if (departments.length !== unique.size) throw new ActionError("invalid");
  const cleaned = input.departments.map((item) => ({ ...item, ...cleanAssignment(item, input.technicalApprovalDate) }));

  const id = await prisma.$transaction(async (tx) => {
    const operation = await tx.operation.create({
      data: {
        nameAr,
        nameEn: input.nameEn.trim(),
        operationTypeId: type.id,
        technicalApprovalDate: parseISODate(input.technicalApprovalDate),
        createdById: user.id,
      },
    });
    for (const item of cleaned) {
      const assignment = await tx.operationDepartment.create({
        data: {
          operationId: operation.id,
          departmentId: item.departmentId,
          approvedAmount: item.amount,
          approvalStart: parseISODate(item.start),
          approvalEnd: item.end ? parseISODate(item.end) : null,
        },
      });
      await writeProgress(tx, assignment.id, type.stages, input.technicalApprovalDate);
    }
    await audit(tx, user.id, "CREATE_OPERATION", "Operation", operation.id, `إنشاء العملية: ${nameAr}`, `Created operation: ${input.nameEn.trim() || nameAr}`);
    return operation.id;
  });
  return id;
}

export async function renameOperation(user: CurrentUser, id: string, nameAr: string, nameEn: string) {
  assertManager(user);
  assertSectorActor(user);
  if (nameAr.trim().length < 3) throw new ActionError("nameRequired");
  const operation = await prisma.operation.findFirst({ where: { id, isDeleted: false } });
  if (!operation) throw new ActionError("notFound");
  await prisma.operation.update({ where: { id }, data: { nameAr: nameAr.trim(), nameEn: nameEn.trim() } });
  await audit(prisma, user.id, "RENAME_OPERATION", "Operation", id, `تعديل اسم العملية إلى: ${nameAr.trim()}`, `Renamed operation to: ${nameEn.trim() || nameAr.trim()}`);
}

export async function deleteOperation(user: CurrentUser, id: string) {
  assertManager(user);
  assertSectorActor(user);
  const operation = await prisma.operation.findFirst({ where: { id, isDeleted: false } });
  if (!operation) throw new ActionError("notFound");
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.operation.update({ where: { id }, data: { isDeleted: true, deletedAt: now } });
    await tx.alert.updateMany({
      where: { progress: { operationDepartment: { operationId: id } } },
      data: { isDeleted: true, deletedAt: now, resolvedAt: now },
    });
    await audit(tx, user.id, "DELETE_OPERATION", "Operation", id, `حذف العملية: ${operation.nameAr}`, `Deleted operation: ${operation.nameEn || operation.nameAr}`);
  });
}

export async function assignDepartments(user: CurrentUser, operationId: string, rows: DepartmentAssignmentInput[]) {
  assertManager(user);
  assertSectorActor(user);
  if (!rows.length) throw new ActionError("departmentRequired");
  const operation = await prisma.operation.findFirst({ where: { id: operationId, isDeleted: false } });
  if (!operation) throw new ActionError("notFound");
  const type = await loadActiveStages(operation.operationTypeId);
  const approval = dateToIso(operation.technicalApprovalDate);
  const cleaned = rows.map((item) => ({ ...item, ...cleanAssignment(item, approval) }));
  const ids = [...new Set(cleaned.map((item) => item.departmentId))];
  const departments = await prisma.department.findMany({ where: { id: { in: ids }, isActive: true } });
  if (departments.length !== ids.length) throw new ActionError("invalid");

  await prisma.$transaction(async (tx) => {
    for (const item of cleaned) {
      const existing = await tx.operationDepartment.findUnique({
        where: { operationId_departmentId: { operationId, departmentId: item.departmentId } },
        include: { progress: true },
      });
      if (existing && !existing.isDeleted) continue;
      if (existing?.isDeleted) {
        await tx.operationDepartment.update({
          where: { id: existing.id },
          data: {
            isDeleted: false,
            approvedAmount: item.amount,
            approvalStart: parseISODate(item.start),
            approvalEnd: item.end ? parseISODate(item.end) : null,
          },
        });
        if (existing.progress.length === 0) await writeProgress(tx, existing.id, type.stages, approval);
        await tx.alert.updateMany({
          where: { progress: { operationDepartmentId: existing.id } },
          data: { isDeleted: false, deletedAt: null },
        });
        continue;
      }
      const created = await tx.operationDepartment.create({
        data: {
          operationId,
          departmentId: item.departmentId,
          approvedAmount: item.amount,
          approvalStart: parseISODate(item.start),
          approvalEnd: item.end ? parseISODate(item.end) : null,
        },
      });
      await writeProgress(tx, created.id, type.stages, approval);
    }
    await audit(tx, user.id, "ASSIGN_DEPARTMENTS", "Operation", operationId, "تخصيص العملية لإدارات إضافية", "Assigned the operation to more departments");
  });
}

export async function removeAssignment(user: CurrentUser, assignmentId: string) {
  assertManager(user);
  const assignment = await prisma.operationDepartment.findFirst({
    where: { id: assignmentId, isDeleted: false },
    include: { department: true, operation: true },
  });
  if (!assignment || assignment.operation.isDeleted) throw new ActionError("notFound");
  assertOwnDepartment(user, assignment.departmentId);
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.operationDepartment.update({ where: { id: assignmentId }, data: { isDeleted: true } });
    await tx.alert.updateMany({
      where: { progress: { operationDepartmentId: assignmentId } },
      data: { isDeleted: true, deletedAt: now, resolvedAt: now },
    });
    await audit(
      tx,
      user.id,
      "REMOVE_ASSIGNMENT",
      "OperationDepartment",
      assignmentId,
      `إزالة تخصيص ${assignment.department.nameAr}`,
      `Removed assignment for ${assignment.department.nameEn}`,
    );
  });
}

export async function adjustFinance(
  user: CurrentUser,
  input: { assignmentId: string; delta: string; effectiveDate: string; reason: string },
) {
  if (!can(user, "finance.manage")) throw new ActionError("forbidden");
  const delta = normalizeMoney(input.delta);
  if (!delta || compareMoney(delta, "0.00") === 0) throw new ActionError("invalidAmount");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveDate)) throw new ActionError("invalidDate");
  const assignment = await prisma.operationDepartment.findFirst({
    where: { id: input.assignmentId, isDeleted: false, operation: { isDeleted: false } },
    include: { department: true, operation: true },
  });
  if (!assignment) throw new ActionError("notFound");
  assertOwnDepartment(user, assignment.departmentId);
  const reason = input.reason.trim() || null;
  await prisma.$transaction(async (tx) => {
    await tx.financialAdjustment.create({
      data: {
        operationDepartmentId: assignment.id,
        deltaAmount: delta,
        effectiveDate: parseISODate(input.effectiveDate),
        reason,
        createdById: user.id,
      },
    });
    await audit(
      tx,
      user.id,
      "FINANCIAL_ADJUSTMENT",
      "OperationDepartment",
      assignment.id,
      `تعديل مالي ${delta} لـ ${assignment.department.nameAr}`,
      `Financial adjustment ${delta} for ${assignment.department.nameEn}`,
    );
  });
}

export async function updateApprovalWindow(
  user: CurrentUser,
  input: { assignmentId: string; start: string; end: string; reason: string },
) {
  if (!can(user, "finance.manage")) throw new ActionError("forbidden");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.start) || !/^\d{4}-\d{2}-\d{2}$/.test(input.end)) throw new ActionError("invalidDate");
  if (diffDays(input.start, input.end) < 0) throw new ActionError("dueBeforeStart");
  const assignment = await prisma.operationDepartment.findFirst({
    where: { id: input.assignmentId, isDeleted: false, operation: { isDeleted: false } },
    include: { department: true },
  });
  if (!assignment) throw new ActionError("notFound");
  assertOwnDepartment(user, assignment.departmentId);
  const data = assignment.approvalStart
    ? { modifiedStart: parseISODate(input.start), modifiedEnd: parseISODate(input.end) }
    : { approvalStart: parseISODate(input.start), approvalEnd: parseISODate(input.end) };
  await prisma.operationDepartment.update({ where: { id: assignment.id }, data });
  const reason = input.reason.trim();
  await audit(
    prisma,
    user.id,
    "APPROVAL_WINDOW",
    "OperationDepartment",
    assignment.id,
    `تعديل فترة الاعتماد لـ ${assignment.department.nameAr}${reason ? ` — ${reason}` : ""}`,
    `Updated the approval window for ${assignment.department.nameEn}${reason ? ` — ${reason}` : ""}`,
  );
}

async function ownProgress(user: CurrentUser, progressId: string) {
  const progress = await prisma.departmentStageProgress.findUnique({
    where: { id: progressId },
    include: {
      stageDefinition: true,
      operationDepartment: { include: { operation: true, department: true } },
    },
  });
  if (!progress || progress.operationDepartment.isDeleted || progress.operationDepartment.operation.isDeleted) {
    throw new ActionError("notFound");
  }
  if (!isDepartmentRole(user.role) || user.departmentId !== progress.operationDepartment.departmentId) {
    throw new ActionError("forbidden");
  }
  return progress;
}

export async function updateStageDates(
  user: CurrentUser,
  input: { progressId: string; plannedStart: string; plannedDue: string; reason: string },
) {
  const reason = input.reason.trim();
  if (reason.length < 3) throw new ActionError("reasonRequired");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.plannedStart) || !/^\d{4}-\d{2}-\d{2}$/.test(input.plannedDue)) {
    throw new ActionError("invalidDate");
  }
  if (diffDays(input.plannedStart, input.plannedDue) < 0) throw new ActionError("dueBeforeStart");
  const progress = await ownProgress(user, input.progressId);
  if (progress.completedAt) throw new ActionError("completedLocked");
  const oldStart = dateToIso(progress.plannedStart);
  const oldDue = dateToIso(progress.plannedDue);
  if (oldStart === input.plannedStart && oldDue === input.plannedDue) throw new ActionError("noChange");

  await prisma.$transaction(async (tx) => {
    await tx.departmentStageProgress.update({
      where: { id: progress.id },
      data: { plannedStart: parseISODate(input.plannedStart), plannedDue: parseISODate(input.plannedDue) },
    });
    if (oldStart !== input.plannedStart) {
      await tx.stageDateChange.create({
        data: {
          progressId: progress.id,
          field: "START",
          oldDate: progress.plannedStart,
          newDate: parseISODate(input.plannedStart),
          reason,
          createdById: user.id,
        },
      });
    }
    if (oldDue !== input.plannedDue) {
      await tx.stageDateChange.create({
        data: {
          progressId: progress.id,
          field: "DUE",
          oldDate: progress.plannedDue,
          newDate: parseISODate(input.plannedDue),
          reason,
          createdById: user.id,
        },
      });
    }
    await audit(
      tx,
      user.id,
      "STAGE_DATES",
      "DepartmentStageProgress",
      progress.id,
      `تعديل موعد ${progress.stageDefinition.nameAr} في ${progress.operationDepartment.department.nameAr}`,
      `Revised ${progress.stageDefinition.nameEn} dates in ${progress.operationDepartment.department.nameEn}`,
    );
  });
}

export async function focusStage(user: CurrentUser, progressId: string, actualStart: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(actualStart)) throw new ActionError("invalidDate");
  const progress = await ownProgress(user, progressId);
  if (progress.completedAt) throw new ActionError("completedLocked");
  await prisma.$transaction([
    prisma.departmentStageProgress.updateMany({
      where: { operationDepartmentId: progress.operationDepartmentId },
      data: { isCurrent: false },
    }),
    prisma.departmentStageProgress.update({
      where: { id: progress.id },
      data: { isCurrent: true, actualStart: progress.actualStart ?? parseISODate(actualStart) },
    }),
  ]);
}

export async function completeStage(user: CurrentUser, progressId: string, completedAt: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(completedAt)) throw new ActionError("invalidDate");
  const progress = await ownProgress(user, progressId);
  if (progress.actualStart && diffDays(dateToIso(progress.actualStart), completedAt) < 0) {
    throw new ActionError("completeBeforeStart");
  }
  await prisma.departmentStageProgress.update({
    where: { id: progress.id },
    data: {
      completedAt: parseISODate(completedAt),
      actualStart: progress.actualStart ?? parseISODate(completedAt),
      isCurrent: false,
    },
  });
  await audit(
    prisma,
    user.id,
    "COMPLETE_STAGE",
    "DepartmentStageProgress",
    progress.id,
    `إنهاء مرحلة ${progress.stageDefinition.nameAr}`,
    `Completed stage ${progress.stageDefinition.nameEn}`,
  );
}

export async function reopenStage(user: CurrentUser, progressId: string, reason: string) {
  if (reason.trim().length < 3) throw new ActionError("reasonRequired");
  const progress = await ownProgress(user, progressId);
  if (!progress.completedAt) throw new ActionError("noChange");
  await prisma.departmentStageProgress.update({ where: { id: progress.id }, data: { completedAt: null, isCurrent: true } });
  await audit(
    prisma,
    user.id,
    "REOPEN_STAGE",
    "DepartmentStageProgress",
    progress.id,
    `إعادة فتح ${progress.stageDefinition.nameAr}: ${reason.trim()}`,
    `Reopened ${progress.stageDefinition.nameEn}: ${reason.trim()}`,
  );
}

export async function deleteAlert(user: CurrentUser, alertId: string) {
  if (!can(user, "alerts.sector")) throw new ActionError("forbidden");
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert || alert.isDeleted) throw new ActionError("notFound");
  const now = new Date();
  await prisma.alert.update({ where: { id: alertId }, data: { isDeleted: true, deletedAt: now } });
  await audit(prisma, user.id, "DELETE_ALERT", "Alert", alertId, "حذف تنبيه", "Deleted an alert");
}

export async function markRevisionsSeen(user: CurrentUser, ids: string[]) {
  if (!can(user, "revisions.view")) throw new ActionError("forbidden");
  await prisma.stageDateChange.updateMany({
    where: { seenAt: null, ...(ids.length ? { id: { in: ids } } : {}) },
    data: { seenAt: new Date() },
  });
}

export async function createUser(
  user: CurrentUser,
  input: { nameAr: string; nameEn: string; email: string; password: string; role: string; departmentId: string },
) {
  if (!can(user, "users.manage")) throw new ActionError("forbidden");
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ActionError("invalid");
  if (input.password.length < 8) throw new ActionError("weakPassword");
  if (input.nameAr.trim().length < 3) throw new ActionError("nameRequired");
  const role = canonicalRole(input.role);
  if (!role || !creatableRoles(user).includes(role)) throw new ActionError("invalidRole");
  const departmentId = isDepartmentRole(role) ? (isDepartmentRole(user.role) ? user.departmentId : input.departmentId) : null;
  if (isDepartmentRole(role) && !departmentId) throw new ActionError("departmentRequired");
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new ActionError("emailTaken");
  if (departmentId) {
    const department = await prisma.department.findFirst({ where: { id: departmentId, isActive: true } });
    if (!department) throw new ActionError("invalid");
  }
  const { hashSync } = await import("bcryptjs");
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash: hashSync(input.password, 10),
      nameAr: input.nameAr.trim(),
      nameEn: input.nameEn.trim() || input.nameAr.trim(),
      role,
      departmentId,
    },
  });
  await audit(prisma, user.id, "CREATE_USER", "User", created.id, `إضافة مستخدم ${email}`, `Added user ${email}`);
}

export async function toggleUser(user: CurrentUser, userId: string) {
  if (!can(user, "users.manage")) throw new ActionError("forbidden");
  if (user.id === userId) throw new ActionError("cannotEditSelf");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new ActionError("notFound");
  assertSameOrganization(user, target);
  await prisma.user.update({ where: { id: userId }, data: { isActive: !target.isActive } });
  await audit(
    prisma,
    user.id,
    "TOGGLE_USER",
    "User",
    userId,
    `${target.isActive ? "إيقاف" : "تفعيل"} المستخدم ${target.email}`,
    `${target.isActive ? "Deactivated" : "Activated"} ${target.email}`,
  );
}

export async function changePassword(user: CurrentUser, currentPassword: string, nextPassword: string, confirm: string) {
  if (nextPassword.length < 8) throw new ActionError("weakPassword");
  if (nextPassword !== confirm) throw new ActionError("passwordMismatch");
  const { compareSync, hashSync } = await import("bcryptjs");
  if (!compareSync(currentPassword, user.passwordHash)) throw new ActionError("wrongPassword");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashSync(nextPassword, 10) } });
}

export async function createType(user: CurrentUser, nameAr: string, nameEn: string, copyDefaults: boolean) {
  if (!can(user, "settings.types")) throw new ActionError("forbidden");
  if (nameAr.trim().length < 2) throw new ActionError("typeNameRequired");
  const count = await prisma.operationType.count();
  const { DEFAULT_STAGES } = await import("./catalog");
  const created = await prisma.operationType.create({
    data: {
      code: `CUSTOM_${Date.now()}`,
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      isSystem: false,
      sortOrder: count + 1,
      stages: copyDefaults
        ? {
            create: DEFAULT_STAGES.map((stage) => ({ ...stage })),
          }
        : undefined,
    },
  });
  await audit(prisma, user.id, "CREATE_TYPE", "OperationType", created.id, `نوع عملية جديد: ${nameAr.trim()}`, `New operation type: ${nameEn.trim() || nameAr.trim()}`);
}

export async function createStage(
  user: CurrentUser,
  input: { typeId: string; nameAr: string; nameEn: string; months: number; days: number; anchor: string },
) {
  if (!can(user, "settings.types")) throw new ActionError("forbidden");
  if (input.nameAr.trim().length < 2) throw new ActionError("stageNameRequired");
  if (input.anchor !== "APPROVAL" && input.anchor !== "FINANCIAL_OPENING") throw new ActionError("invalid");
  const months = Math.max(0, Math.trunc(input.months));
  const days = Math.max(0, Math.trunc(input.days));
  if (months === 0 && days === 0) throw new ActionError("invalid");
  const type = await prisma.operationType.findUnique({ where: { id: input.typeId }, include: { stages: true } });
  if (!type) throw new ActionError("notFound");
  const sortOrder = Math.max(0, ...type.stages.map((stage) => stage.sortOrder)) + 1;
  await prisma.stageDefinition.create({
    data: {
      operationTypeId: type.id,
      code: `STAGE_${Date.now()}`,
      nameAr: input.nameAr.trim(),
      nameEn: input.nameEn.trim() || input.nameAr.trim(),
      sortOrder,
      durationMonths: months,
      durationDays: days,
      anchor: input.anchor,
    },
  });
  await audit(prisma, user.id, "CREATE_STAGE", "OperationType", type.id, `مرحلة جديدة لنوع ${type.nameAr}`, `New stage for ${type.nameEn}`);
}

export async function updateStage(
  user: CurrentUser,
  input: { id: string; nameAr: string; nameEn: string; months: number; days: number; anchor: string },
) {
  if (!can(user, "settings.types")) throw new ActionError("forbidden");
  if (input.nameAr.trim().length < 2) throw new ActionError("stageNameRequired");
  if (input.anchor !== "APPROVAL" && input.anchor !== "FINANCIAL_OPENING") throw new ActionError("invalid");
  const months = Math.max(0, Math.trunc(input.months));
  const days = Math.max(0, Math.trunc(input.days));
  if (months === 0 && days === 0) throw new ActionError("invalid");
  const stage = await prisma.stageDefinition.findUnique({ where: { id: input.id } });
  if (!stage) throw new ActionError("notFound");
  await prisma.stageDefinition.update({
    where: { id: stage.id },
    data: {
      nameAr: input.nameAr.trim(),
      nameEn: input.nameEn.trim() || input.nameAr.trim(),
      durationMonths: months,
      durationDays: days,
      anchor: input.anchor,
    },
  });
}

export async function assignTasks(
  actor: CurrentUser,
  input: { userId: string; tasks: string[]; applyToRole: boolean; reset: boolean },
) {
  if (!can(actor, "users.manage")) throw new ActionError("forbidden");
  const target = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!target) throw new ActionError("notFound");
  if (actor.id === target.id) throw new ActionError("cannotEditSelf");
  assertSameOrganization(actor, target);
  const tasks = input.reset
    ? null
    : JSON.stringify(input.tasks.filter((item) => isPermission(item) && (can(actor, "users.manageAll") || (item !== "users.manageAll" && item !== "audit.view"))));
  if (input.applyToRole && !input.reset) {
    if (rankOf(actor.role) !== "SUPER_ADMIN") throw new ActionError("forbidden");
    await prisma.user.updateMany({
      where: { role: target.role, ...(isDepartmentRole(actor.role) ? { departmentId: actor.departmentId ?? "__none__" } : {}) },
      data: { tasks },
    });
    await audit(prisma, actor.id, "ASSIGN_TASKS", "User", target.role, `مهام كل حسابات ${roleLabel("ar", target.role)}`, `Tasks for every ${roleLabel("en", target.role)} account`);
    return;
  }
  await prisma.user.update({ where: { id: target.id }, data: { tasks } });
  await audit(prisma, actor.id, "ASSIGN_TASKS", "User", target.id, `مهام ${target.email}`, `Tasks for ${target.email}`);
}

export async function syncAlerts() {
  const today = todayISO();
  const rows = await prisma.departmentStageProgress.findMany({
    where: { operationDepartment: { isDeleted: false, operation: { isDeleted: false } } },
    include: { alerts: true },
  });
  for (const row of rows) {
    const wanted = new Set(
      evaluateAlertTypes(
        { start: dateToIso(row.plannedStart), due: dateToIso(row.plannedDue), completed: Boolean(row.completedAt) },
        today,
      ),
    );
    for (const type of ["OVERDUE", "HALFWAY", "DUE_SOON"] as const) {
      const existing = row.alerts.find((alert) => alert.type === type);
      if (wanted.has(type)) {
        if (!existing) {
          try {
            await prisma.alert.create({
              data: { progressId: row.id, type, audience: type === "OVERDUE" ? "SECTOR" : "DEPARTMENT" },
            });
          } catch (error) {
            const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
            if (code !== "P2002") throw error;
          }
        } else if (!existing.isDeleted && existing.resolvedAt) {
          await prisma.alert.update({ where: { id: existing.id }, data: { resolvedAt: null } });
        }
      } else if (existing && !existing.isDeleted && !existing.resolvedAt) {
        await prisma.alert.update({ where: { id: existing.id }, data: { resolvedAt: new Date() } });
      }
    }
  }
}

export async function softDeleteType(user: CurrentUser, typeId: string) {
  if (!can(user, "settings.types")) throw new ActionError("forbidden");
  const type = await prisma.operationType.findFirst({ where: { id: typeId, deletedAt: null } });
  if (!type) throw new ActionError("notFound");
  if (type.isSystem) throw new ActionError("forbidden");
  const now = new Date();
  await prisma.operationType.update({
    where: { id: typeId },
    data: { deletedAt: now, deletedById: user.id, isActive: false },
  });
  await audit(prisma, user.id, "DELETE_TYPE", "OperationType", typeId, `حذف نوع العملية: ${type.nameAr}`, `Deleted operation type: ${type.nameEn}`);
}

export async function restoreType(user: CurrentUser, typeId: string) {
  if (!can(user, "settings.types")) throw new ActionError("forbidden");
  const type = await prisma.operationType.findFirst({ where: { id: typeId, deletedAt: { not: null } } });
  if (!type) throw new ActionError("notFound");
  await prisma.operationType.update({
    where: { id: typeId },
    data: { deletedAt: null, deletedById: null, isActive: true },
  });
  await audit(prisma, user.id, "RESTORE_TYPE", "OperationType", typeId, `استرجاع نوع العملية: ${type.nameAr}`, `Restored operation type: ${type.nameEn}`);
}

export async function addFundingTranche(
  user: CurrentUser,
  input: { operationDepartmentId: string; sentAt: string; amount: string; note?: string },
) {
  if (!can(user, "finance.manage")) throw new ActionError("forbidden");
  assertSectorActor(user);
  const amount = normalizeMoney(input.amount);
  if (!amount) throw new ActionError("invalidAmount");
  const sentAt = parseISODate(input.sentAt);
  const assignment = await prisma.operationDepartment.findFirst({
    where: { id: input.operationDepartmentId, isDeleted: false },
  });
  if (!assignment) throw new ActionError("notFound");
  const last = await prisma.fundingTranche.findFirst({
    where: { operationDepartmentId: assignment.id },
    orderBy: { sequence: "desc" },
  });
  const sequence = (last?.sequence ?? 0) + 1;
  const created = await prisma.fundingTranche.create({
    data: {
      operationDepartmentId: assignment.id,
      sequence,
      sentAt,
      amount,
      note: input.note?.trim() || null,
      createdById: user.id,
    },
  });
  await audit(
    prisma,
    user.id,
    "ADD_FUNDING_TRANCHE",
    "FundingTranche",
    created.id,
    `دفعة اعتماد رقم ${sequence}`,
    `Funding tranche #${sequence}`,
  );
  return created.id;
}

export async function createNeedRequest(
  user: CurrentUser,
  input: {
    operationTypeId: string;
    title: string;
    description?: string;
    requirements: string;
    requestedSupport: "FINANCIAL" | "TECHNICAL" | "BOTH";
    estimatedValue?: string;
    desiredStartDate?: string;
    expectedDurationDays?: number;
  },
) {
  if (!can(user, "needs.create")) throw new ActionError("forbidden");
  if (!isDepartmentRole(user.role) || !user.departmentId) throw new ActionError("forbidden");
  if (input.title.trim().length < 3 || input.requirements.trim().length < 3) throw new ActionError("invalid");
  const type = await prisma.operationType.findFirst({
    where: { id: input.operationTypeId, deletedAt: null, isActive: true },
  });
  if (!type) throw new ActionError("notFound");
  let estimatedValue: string | null = null;
  if (input.estimatedValue?.trim()) {
    estimatedValue = normalizeMoney(input.estimatedValue);
    if (!estimatedValue) throw new ActionError("invalidAmount");
  }
  const created = await prisma.operationNeedRequest.create({
    data: {
      departmentId: user.departmentId,
      operationTypeId: type.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      requirements: input.requirements.trim(),
      requestedSupport: input.requestedSupport,
      estimatedValue,
      desiredStartDate: input.desiredStartDate ? parseISODate(input.desiredStartDate) : null,
      expectedDurationDays: input.expectedDurationDays ? Math.max(1, Math.trunc(input.expectedDurationDays)) : null,
      status: "SUBMITTED",
      createdById: user.id,
    },
  });
  await audit(prisma, user.id, "CREATE_NEED", "OperationNeedRequest", created.id, `طلب احتياج: ${created.title}`, `Needs request: ${created.title}`);
  return created.id;
}

export async function respondNeedRequest(
  user: CurrentUser,
  input: {
    id: string;
    decision: "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED";
    decisionNote?: string;
    approvedAmount?: string;
    linkedOperationId?: string;
    tranche?: { operationDepartmentId: string; sentAt: string; amount: string; note?: string };
  },
) {
  if (!can(user, "needs.respond")) throw new ActionError("forbidden");
  assertSectorActor(user);
  const request = await prisma.operationNeedRequest.findUnique({ where: { id: input.id } });
  if (!request) throw new ActionError("notFound");
  if (request.status === "FULFILLED" || request.status === "REJECTED") throw new ActionError("invalid");
  let approvedAmount: string | null = null;
  if (input.approvedAmount?.trim()) {
    approvedAmount = normalizeMoney(input.approvedAmount);
    if (!approvedAmount) throw new ActionError("invalidAmount");
  }
  if (input.linkedOperationId) {
    const op = await prisma.operation.findFirst({ where: { id: input.linkedOperationId, isDeleted: false } });
    if (!op) throw new ActionError("notFound");
  }
  await prisma.operationNeedRequest.update({
    where: { id: input.id },
    data: {
      status: input.decision,
      decisionNote: input.decisionNote?.trim() || null,
      approvedAmount,
      linkedOperationId: input.linkedOperationId || null,
      reviewedById: user.id,
      reviewedAt: new Date(),
    },
  });
  if (input.tranche && (input.decision === "APPROVED" || input.decision === "PARTIALLY_APPROVED")) {
    await addFundingTranche(user, input.tranche);
  }
  await audit(
    prisma,
    user.id,
    "RESPOND_NEED",
    "OperationNeedRequest",
    input.id,
    `رد على طلب احتياج: ${input.decision}`,
    `Responded to needs request: ${input.decision}`,
  );
}

export async function deleteUserAccount(user: CurrentUser, targetId: string) {
  if (!can(user, "users.manage")) throw new ActionError("forbidden");
  if (targetId === user.id) throw new ActionError("cannotEditSelf");
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new ActionError("notFound");
  assertSameOrganization(user, target);
  await prisma.user.update({ where: { id: targetId }, data: { isActive: false } });
  await audit(prisma, user.id, "DELETE_USER", "User", targetId, `إيقاف حساب: ${target.email}`, `Deactivated account: ${target.email}`);
}

export { dateOrNull };
