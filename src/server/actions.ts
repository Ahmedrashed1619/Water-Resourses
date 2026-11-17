"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { dict } from "@/i18n/dictionaries";
import { requireUser } from "@/lib/auth";
import { SESSION_COOKIE, LOCALE_COOKIE } from "@/lib/constants";
import { getLocale } from "@/lib/locale";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/jwt";
import { ActionError } from "@/lib/services";
import * as services from "@/lib/services";
import type { Locale } from "@/lib/text";

export type ActionResult = { ok: boolean; message: string };

function fail(locale: Locale, error: unknown): ActionResult {
  const code = error instanceof ActionError ? error.code : "unexpected";
  const errors = dict(locale).errors as Record<string, string>;
  return { ok: false, message: errors[code] ?? errors.unexpected };
}

function num(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const locale = await getLocale();
  try {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || user.deletedAt || !bcrypt.compareSync(password, user.passwordHash)) {
      return { ok: false, message: dict(locale).errors.invalidLogin };
    }
    const token = await signSession({ sub: user.id, role: user.role, departmentId: user.departmentId });
    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        summaryAr: "تسجيل دخول",
        summaryEn: "Signed in",
      },
    });
  } catch (error) {
    return fail(locale, error);
  }
  redirect("/");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function setLocaleAction(locale: Locale) {
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

export async function createOperationAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  if (!can(user, "operations.manage")) return { ok: false, message: dict(locale).errors.forbidden };
  let id = "";
  try {
    const raw = JSON.parse(String(formData.get("departments") || "[]")) as services.DepartmentAssignmentInput[];
    id = await services.createOperation(user, {
      nameAr: String(formData.get("nameAr") || ""),
      nameEn: String(formData.get("nameEn") || ""),
      operationTypeId: String(formData.get("operationTypeId") || ""),
      technicalApprovalDate: String(formData.get("technicalApprovalDate") || ""),
      departments: Array.isArray(raw) ? raw : [],
    });
  } catch (error) {
    return fail(locale, error);
  }
  redirect(`/operations/${id}`);
}

export async function renameOperationAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.renameOperation(user, String(formData.get("id") || ""), String(formData.get("nameAr") || ""), String(formData.get("nameEn") || ""));
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "تم حفظ الاسم" : "Name saved" };
}

export async function deleteOperationAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await services.deleteOperation(user, String(formData.get("id") || ""));
  redirect("/operations");
}

export async function assignDepartmentsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    const raw = JSON.parse(String(formData.get("departments") || "[]")) as services.DepartmentAssignmentInput[];
    await services.assignDepartments(user, String(formData.get("operationId") || ""), Array.isArray(raw) ? raw : []);
    await services.syncAlerts();
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "تم التخصيص" : "Departments assigned" };
}

export async function removeAssignmentAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.removeAssignment(user, String(formData.get("id") || ""));
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "أُزيل التخصيص" : "Assignment removed" };
}

export async function adjustFinanceAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.adjustFinance(user, {
      assignmentId: String(formData.get("assignmentId") || ""),
      delta: String(formData.get("delta") || ""),
      effectiveDate: String(formData.get("effectiveDate") || ""),
      reason: String(formData.get("reason") || ""),
    });
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "سُجّل التعديل المالي" : "Financial adjustment recorded" };
}

export async function updateWindowAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.updateApprovalWindow(user, {
      assignmentId: String(formData.get("assignmentId") || ""),
      start: String(formData.get("start") || ""),
      end: String(formData.get("end") || ""),
      reason: String(formData.get("reason") || ""),
    });
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "حُفظت فترة الاعتماد" : "Approval window saved" };
}

export async function updateDatesAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.updateStageDates(user, {
      progressId: String(formData.get("progressId") || ""),
      plannedStart: String(formData.get("plannedStart") || ""),
      plannedDue: String(formData.get("plannedDue") || ""),
      reason: String(formData.get("reason") || ""),
    });
    await services.syncAlerts();
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "حُفظ التعديل وظهر للقطاع مع السبب" : "The revision was saved for the Sector, with its reason" };
}

export async function createDepartmentStageTypeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    if (!can(user, "stages.createType")) return { ok: false, message: dict(locale).errors.forbidden };
    const operationDepartmentId = String(formData.get("operationDepartmentId") || "");
    const plannedStart = String(formData.get("plannedStart") || "");
    const plannedDue = String(formData.get("plannedDue") || "");
    const nameAr = String(formData.get("nameAr") || "");
    const nameEn = String(formData.get("nameEn") || "");
    // Start and finish are mandatory; validate before anything is created.
    if (!plannedStart || !plannedDue) throw new ActionError("stageDatesRequired");
    let operationTypeId = String(formData.get("operationTypeId") || "");
    if (operationDepartmentId) {
      if (!can(user, "stages.add")) throw new ActionError("forbidden");
      const assignment = await prisma.operationDepartment.findFirst({
        where: { id: operationDepartmentId, isDeleted: false, operation: { isDeleted: false } },
        include: { operation: { select: { operationTypeId: true } } },
      });
      if (!assignment) throw new ActionError("notFound");
      if (assignment.departmentId !== user.departmentId) throw new ActionError("forbidden");
      operationTypeId = assignment.operation.operationTypeId;
    }
    const stageDefinitionId = await services.createDepartmentStageType(user, { operationTypeId, nameAr, nameEn });
    // Optionally attach the new stage to the assignment in the same step (needs stages.add too).
    if (operationDepartmentId) {
      await services.addStageToAssignment(user, {
        operationDepartmentId,
        stageDefinitionId,
        plannedStart,
        plannedDue,
        note: String(formData.get("note") || ""),
      });
      await services.syncAlerts();
    }
  } catch (error) {
    return fail(locale, error);
  }
  revalidatePath("/operations");
  return { ok: true, message: locale === "ar" ? "أُنشئ نوع المرحلة وأُضيف إلى العملية" : "Stage type created and added to the operation" };
}

export async function addStageToAssignmentAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.addStageToAssignment(user, {
      operationDepartmentId: String(formData.get("operationDepartmentId") || ""),
      stageDefinitionId: String(formData.get("stageDefinitionId") || ""),
      plannedStart: String(formData.get("plannedStart") || ""),
      plannedDue: String(formData.get("plannedDue") || ""),
      note: String(formData.get("note") || ""),
    });
    await services.syncAlerts();
  } catch (error) {
    return fail(locale, error);
  }
  revalidatePath("/operations");
  return { ok: true, message: locale === "ar" ? "أُضيفت المرحلة وظهرت للقطاع" : "Stage added and visible to the Sector" };
}

export async function focusStageAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.focusStage(user, String(formData.get("progressId") || ""), String(formData.get("actualStart") || ""));
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "أصبحت هذه المرحلة الحالية" : "This is now the active stage" };
}

export async function completeStageAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.completeStage(user, String(formData.get("progressId") || ""), String(formData.get("completedAt") || ""));
    await services.syncAlerts();
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "أُقفلت المرحلة ولن تولّد تنبيهات" : "Stage closed. It will not raise alerts" };
}

export async function reopenStageAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.reopenStage(user, String(formData.get("progressId") || ""), String(formData.get("reason") || ""));
    await services.syncAlerts();
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "أُعيد فتح المرحلة" : "Stage reopened" };
}

export async function deleteAlertAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.deleteAlert(user, String(formData.get("id") || ""));
  } catch (error) {
    return fail(locale, error);
  }
  revalidatePath("/alerts");
  return { ok: true, message: locale === "ar" ? "نُقل التنبيه إلى سجل المحذوفات" : "Alert moved to the deleted log" };
}

export async function deleteAlertsBulkAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    const ids = formData.getAll("ids").map(String);
    const count = await services.deleteAlertsBulk(user, ids);
    revalidatePath("/alerts");
    return {
      ok: true,
      message: locale === "ar" ? `نُقل ${count} تنبيه إلى سجل المحذوفات` : `${count} alert(s) moved to the deleted log`,
    };
  } catch (error) {
    return fail(locale, error);
  }
}

export async function restoreAlertAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.restoreAlert(user, String(formData.get("id") || ""));
  } catch (error) {
    return fail(locale, error);
  }
  revalidatePath("/alerts");
  return { ok: true, message: locale === "ar" ? "استُرجع التنبيه" : "Alert restored" };
}

export async function markRevisionsSeenAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  await services.markRevisionsSeen(user, id ? [id] : []);
}

export async function createUserAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.createUser(user, {
      nameAr: String(formData.get("nameAr") || ""),
      nameEn: String(formData.get("nameEn") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      role: String(formData.get("role") || "DEPARTMENT"),
      departmentId: String(formData.get("departmentId") || ""),
    });
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "أُضيف المستخدم" : "User added" };
}

export async function toggleUserAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await services.toggleUser(user, String(formData.get("id") || ""));
}

export async function changePasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.changePassword(
      user,
      String(formData.get("currentPassword") || ""),
      String(formData.get("newPassword") || ""),
      String(formData.get("confirmPassword") || ""),
    );
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "تم تغيير كلمة المرور" : "Password changed" };
}

export async function createTypeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.createType(user, String(formData.get("nameAr") || ""), String(formData.get("nameEn") || ""), formData.get("copyDefaults") === "on");
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "أُضيف نوع العملية" : "Operation type added" };
}

export async function createStageAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.createStage(user, {
      typeId: String(formData.get("typeId") || ""),
      nameAr: String(formData.get("nameAr") || ""),
      nameEn: String(formData.get("nameEn") || ""),
      months: num(formData.get("months")),
      days: num(formData.get("days")),
      anchor: String(formData.get("anchor") || "APPROVAL"),
    });
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "أُضيفت المرحلة" : "Stage added" };
}

export async function updateStageAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.updateStage(user, {
      id: String(formData.get("id") || ""),
      nameAr: String(formData.get("nameAr") || ""),
      nameEn: String(formData.get("nameEn") || ""),
      months: num(formData.get("months")),
      days: num(formData.get("days")),
      anchor: String(formData.get("anchor") || "APPROVAL"),
    });
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "حُفظت المرحلة. يسري التغيير على العمليات الجديدة" : "Stage saved. The change applies to new operations" };
}

export async function assignTasksAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.assignTasks(user, {
      userId: String(formData.get("userId") || ""),
      tasks: formData.getAll("task").map(String),
      applyToRole: formData.get("applyToRole") === "on",
      reset: formData.get("reset") === "1",
    });
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "حُفظت المهام" : "Tasks saved" };
}

export async function deleteTypeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.softDeleteType(user, String(formData.get("id") || ""));
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "نُقل نوع العملية إلى سجل المحذوفات" : "Operation type moved to the recycle bin" };
}

export async function restoreTypeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.restoreType(user, String(formData.get("id") || ""));
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "استُرجع نوع العملية" : "Operation type restored" };
}

export async function addFundingTrancheAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.addFundingTranche(user, {
      operationDepartmentId: String(formData.get("operationDepartmentId") || ""),
      sentAt: String(formData.get("sentAt") || ""),
      amount: String(formData.get("amount") || ""),
      note: String(formData.get("note") || ""),
    });
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "أُضيفت دفعة الاعتماد" : "Funding tranche added" };
}

export async function createNeedRequestAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.createNeedRequest(user, {
      operationTypeId: String(formData.get("operationTypeId") || ""),
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      requirements: String(formData.get("requirements") || ""),
      requestedSupport: String(formData.get("requestedSupport") || "BOTH") as "FINANCIAL" | "TECHNICAL" | "BOTH",
      estimatedValue: String(formData.get("estimatedValue") || ""),
      desiredStartDate: String(formData.get("desiredStartDate") || "") || undefined,
      expectedDurationDays: num(formData.get("expectedDurationDays")) || undefined,
    });
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "أُرسل طلب الاحتياج" : "Needs request submitted" };
}

export async function respondNeedRequestAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    const trancheOd = String(formData.get("trancheOperationDepartmentId") || "");
    await services.respondNeedRequest(user, {
      id: String(formData.get("id") || ""),
      decision: String(formData.get("decision") || "REJECTED") as "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED",
      decisionNote: String(formData.get("decisionNote") || ""),
      approvedAmount: String(formData.get("approvedAmount") || ""),
      linkedOperationId: String(formData.get("linkedOperationId") || "") || undefined,
      tranche: trancheOd
        ? {
            operationDepartmentId: trancheOd,
            sentAt: String(formData.get("trancheSentAt") || ""),
            amount: String(formData.get("trancheAmount") || ""),
            note: String(formData.get("trancheNote") || ""),
          }
        : undefined,
    });
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "حُفظ الرد على الطلب" : "Response saved" };
}

export async function deleteUserAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.deleteUserAccount(user, String(formData.get("id") || ""));
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "حُذف الحساب" : "Account deleted" };
}

export async function restoreUserAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  try {
    await services.restoreUserAccount(user, String(formData.get("id") || ""));
  } catch (error) {
    return fail(locale, error);
  }
  return { ok: true, message: locale === "ar" ? "استُرجع الحساب" : "Account restored" };
}
