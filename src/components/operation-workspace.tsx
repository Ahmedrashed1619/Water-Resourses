"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { diffDays } from "@/lib/dates";
import { daysPhrase, formatDate, formatStamp } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { changeKindLabel, fieldLabel, statusLabel } from "@/lib/labels";
import { warnPublicationToTechnicalGap, warnTechnicalOpeningPostponement } from "@/lib/needs-rules";
import type { AssignmentVM, OperationDetail, StageVM } from "@/lib/view";
import {
  adjustFinanceAction,
  assignDepartmentsAction,
  completeStageAction,
  deleteOperationAction,
  focusStageAction,
  removeAssignmentAction,
  renameOperationAction,
  reopenStageAction,
  updateDatesAction,
  updateWindowAction,
} from "@/server/actions";
import { AddStagePanel } from "./add-stage-panel";
import { FormMessage, SubmitButton } from "./form-bits";
import { Modal, useCloseWhenSaved } from "./modal";
import { StageTrack, StatusChip } from "./ui";

type Dept = { id: string; nameAr: string; nameEn: string };

export function OperationWorkspace({
  operation,
  directory,
  canManage,
  canExecuteStages = false,
  canEditDates = false,
  canAddStage = false,
  canCreateStageType = false,
  isDepartment,
  today,
  scopedDepartmentId = null,
}: {
  operation: OperationDetail;
  directory: Dept[];
  canManage: boolean;
  canExecuteStages?: boolean;
  canEditDates?: boolean;
  canAddStage?: boolean;
  canCreateStageType?: boolean;
  isDepartment: boolean;
  today: string;
  scopedDepartmentId?: string | null;
}) {
  const { locale, t, name, d } = useI18n();
  const [renameState, rename] = useActionState(renameOperationAction, null);
  const trackRows = operation.assignments[0]?.stages.map((stage) => ({
    name: name(stage.nameAr, stage.nameEn),
    start: stage.plannedStart,
    due: stage.plannedDue,
    status: stage.status,
  })) ?? [];

  return (
    <div className="stack">
      <header className="between page-header">
        <div className="page-header-copy">
          <p className="kicker">{name(operation.typeAr, operation.typeEn)}</p>
          <h1>{name(operation.nameAr, operation.nameEn)}</h1>
          <p className="lede">
            {t("الموافقة الفنية", "Technical approval")} {formatDate(operation.approvalDate)} · {t("أنشأها", "Created by")} {name(operation.creatorAr, operation.creatorEn)}
            {scopedDepartmentId ? ` · ${t("عرض مقصور على إدارة واحدة", "Scoped to one department")}` : ""}
          </p>
        </div>
        <div className="op-header-status">
          <StatusChip locale={locale} status={operation.status} />
        </div>
      </header>
      {!scopedDepartmentId && isDepartment ? (
        <p className="banner">
          {t(
            "المواعيد المرجعية ثابتة، والمخطط هو ما تعدله الإدارة مع سبب.",
            "Baselines stay fixed; the department edits the plan with a reason.",
          )}
        </p>
      ) : null}
      <div className="card card-pad">
        <StageTrack rows={trackRows} />
      </div>
      {canManage ? (
        <form action={rename} className="card card-pad grid-2">
          <input type="hidden" name="id" value={operation.id} />
          <label className="field">
            <span>{t("اسم العملية", "Operation name")}</span>
            <input className="input" name="nameAr" defaultValue={operation.nameAr} />
          </label>
          <label className="field">
            <span>{t("الاسم بالإنجليزية", "English name")}</span>
            <input className="input" name="nameEn" defaultValue={operation.nameEn} />
          </label>
          <div className="row">
            <SubmitButton className="btn btn-ghost" label={d.common.save} pendingLabel={d.common.saving} />
          </div>
          <FormMessage result={renameState} />
        </form>
      ) : null}
      {operation.assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          canManage={canManage}
          canExecuteStages={canExecuteStages}
          canEditDates={canEditDates}
          canAddStage={canAddStage}
          canCreateStageType={canCreateStageType}
          isDepartment={isDepartment}
          today={today}
        />
      ))}
      {canManage ? <AssignMore operationId={operation.id} directory={directory.filter((item) => !operation.assignments.some((assignment) => assignment.departmentId === item.id))} approval={operation.approvalDate} /> : null}
      {canManage ? (
        <form action={deleteOperationAction} className="card card-pad row">
          <input type="hidden" name="id" value={operation.id} />
          <span>{t("الحذف منطقي ويُبقي الأثر في السجل.", "Deletion is soft and keeps the audit trail.")}</span>
          <SubmitButton className="btn btn-danger" label={t("حذف العملية", "Delete operation")} pendingLabel={d.common.saving} />
        </form>
      ) : null}
      <Link className="link" href="/operations">{d.common.back}</Link>
    </div>
  );
}

function AssignmentCard({
  assignment,
  canManage,
  canExecuteStages,
  canEditDates,
  canAddStage,
  canCreateStageType,
  isDepartment,
  today,
}: {
  assignment: AssignmentVM;
  canManage: boolean;
  canExecuteStages: boolean;
  canEditDates: boolean;
  canAddStage: boolean;
  canCreateStageType: boolean;
  isDepartment: boolean;
  today: string;
}) {
  const { locale, t, name, d } = useI18n();
  const [moneyState, moneyAction] = useActionState(adjustFinanceAction, null);
  const [windowState, windowAction] = useActionState(updateWindowAction, null);
  const [removeState, removeAction] = useActionState(removeAssignmentAction, null);
  const [panel, setPanel] = useState<"money" | "window" | null>(null);
  useCloseWhenSaved(moneyState, () => setPanel(null));
  useCloseWhenSaved(windowState, () => setPanel(null));
  return (
    <section className="card card-pad stack">
      <div className="between">
        <div>
          <p className="kicker">{t("الإدارة", "Department")}</p>
          <h2>{name(assignment.departmentAr, assignment.departmentEn)}</h2>
        </div>
        <StatusChip locale={locale} status={assignment.status} />
      </div>
      <div className="money-grid">
        <div><span>{t("قيمة الاعتماد", "Approved amount")}</span><b className="num">{formatMoney(assignment.approvedAmount, locale)}</b></div>
        <div><span>{t("مجموع التعديلات", "Adjustments")}</span><b className="num">{formatMoney(assignment.delta, locale)}</b></div>
        <div><span>{t("القيمة الحالية", "Current amount")}</span><b className="num">{formatMoney(assignment.currentAmount, locale)}</b></div>
        <div>
          <span>{t("فترة الاعتماد", "Approval window")}</span>
          <b className="num">{formatDate(assignment.approvalStart)} – {formatDate(assignment.approvalEnd)}</b>
          {assignment.modifiedStart || assignment.modifiedEnd ? <small className="note">{t("المعدل", "Revised")} {formatDate(assignment.modifiedStart ?? assignment.approvalStart)} – {formatDate(assignment.modifiedEnd ?? assignment.approvalEnd)}</small> : null}
        </div>
      </div>
      {canManage ? (
        <div className="row">
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setPanel("money")}>{t("تعديل مالي", "Financial adjustment")}</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setPanel("window")}>{t("تعديل فترة الاعتماد", "Revise the approval window")}</button>
        </div>
      ) : null}
      <Modal open={panel === "money"} title={t("تعديل مالي", "Financial adjustment")} subtitle={name(assignment.departmentAr, assignment.departmentEn)} onClose={() => setPanel(null)}>
        <form action={moneyAction} className="stack">
          <input type="hidden" name="assignmentId" value={assignment.id} />
          <label className="field"><span>{t("الفرق (+ أو -)", "Delta (+ or -)")}</span><input className="input" name="delta" placeholder="250000" required /></label>
          <label className="field"><span>{t("تاريخ السريان", "Effective date")}</span><input className="input" type="date" name="effectiveDate" defaultValue={today} required /></label>
          <label className="field"><span>{d.common.reason} · {d.common.optional}</span><input className="input" name="reason" /></label>
          <div className="row">
            <SubmitButton className="btn btn-primary" label={d.common.add} pendingLabel={d.common.saving} />
            <button className="btn btn-ghost" type="button" onClick={() => setPanel(null)}>{d.common.cancel}</button>
          </div>
          <FormMessage result={moneyState?.ok ? null : moneyState} />
        </form>
      </Modal>
      <Modal open={panel === "window"} title={t("بدء ونهو الاعتماد", "Approval start and finish")} subtitle={name(assignment.departmentAr, assignment.departmentEn)} onClose={() => setPanel(null)}>
        <form action={windowAction} className="stack">
          <input type="hidden" name="assignmentId" value={assignment.id} />
          <label className="field"><span>{t("البدء", "Start")}</span><input className="input" type="date" name="start" defaultValue={assignment.modifiedStart ?? assignment.approvalStart ?? today} required /></label>
          <label className="field"><span>{t("النهو", "Finish")}</span><input className="input" type="date" name="end" defaultValue={assignment.modifiedEnd ?? assignment.approvalEnd ?? today} required /></label>
          <label className="field"><span>{d.common.reason} · {d.common.optional}</span><input className="input" name="reason" /></label>
          <div className="row">
            <SubmitButton label={d.common.save} pendingLabel={d.common.saving} />
            <button className="btn btn-ghost" type="button" onClick={() => setPanel(null)}>{d.common.cancel}</button>
          </div>
          <FormMessage result={windowState?.ok ? null : windowState} />
        </form>
      </Modal>
      {assignment.adjustments.length ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t("الفرق", "Delta")}</th>
                <th>{t("السريان", "Effective")}</th>
                <th>{d.common.reason}</th>
                <th>{t("بواسطة", "By")}</th>
              </tr>
            </thead>
            <tbody>
              {assignment.adjustments.map((item) => (
                <tr key={item.id}>
                  <td className="num">{formatMoney(item.delta, locale)}</td>
                  <td className="num">{formatDate(item.effectiveDate)}</td>
                  <td>{item.reason || "—"}</td>
                  <td>{name(item.actorAr, item.actorEn)}<br /><span className="fine">{formatStamp(item.createdAt, locale)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <StageTrack rows={assignment.stages.map((stage) => ({ name: name(stage.nameAr, stage.nameEn), start: stage.plannedStart, due: stage.plannedDue, status: stage.status }))} />
      <div className="stage-list">
        {assignment.stages.map((stage) => (
          <StageCard
            key={stage.progressId}
            stage={stage}
            siblings={assignment.stages}
            canExecuteStages={canExecuteStages}
            canEditDates={canEditDates}
            today={today}
          />
        ))}
      </div>
      {isDepartment && (canAddStage || canCreateStageType) ? (
        <AddStagePanel assignment={assignment} canAddStage={canAddStage} canCreateStageType={canCreateStageType} today={today} />
      ) : null}
      {canManage ? (
        <form action={removeAction} className="row">
          <input type="hidden" name="id" value={assignment.id} />
          <SubmitButton className="btn btn-danger btn-sm" label={t("إزالة الإدارة من العملية", "Remove department")} pendingLabel={d.common.saving} />
          <FormMessage result={removeState} />
        </form>
      ) : null}
    </section>
  );
}

function StageCard({
  stage,
  siblings,
  canExecuteStages,
  canEditDates,
  today,
}: {
  stage: StageVM;
  siblings: StageVM[];
  canExecuteStages: boolean;
  canEditDates: boolean;
  today: string;
}) {
  const { locale, t, name, d } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [datesState, datesAction] = useActionState(updateDatesAction, null);
  const [focusState, focusAction] = useActionState(focusStageAction, null);
  const [doneState, doneAction] = useActionState(completeStageAction, null);
  const [openState, openAction] = useActionState(reopenStageAction, null);
  const [draftStart, setDraftStart] = useState(stage.plannedStart);
  const [draftDue, setDraftDue] = useState(stage.plannedDue);
  useEffect(() => {
    if (datesState?.ok) dialog.current?.close();
  }, [datesState]);
  const softWarnings = useMemo(() => {
    const warnings = [];
    const publication = siblings.find((item) => item.code === "PUBLICATION");
    const technical = siblings.find((item) => item.code === "TECHNICAL_OPENING");
    if (stage.code === "PUBLICATION" || stage.code === "TECHNICAL_OPENING") {
      const pubDue = stage.code === "PUBLICATION" ? draftDue : publication?.plannedDue;
      const techStart = stage.code === "TECHNICAL_OPENING" ? draftStart : technical?.plannedStart;
      if (pubDue && techStart) {
        const gap = warnPublicationToTechnicalGap(pubDue, techStart);
        if (gap) warnings.push(gap);
      }
    }
    if (stage.code === "TECHNICAL_OPENING") {
      const originalSpan = Math.max(0, diffDays(stage.baselineStart, stage.baselineDue));
      const postponeDays = Math.max(0, diffDays(stage.plannedDue, draftDue));
      if (postponeDays > 0) {
        const postpone = warnTechnicalOpeningPostponement(originalSpan, postponeDays);
        if (postpone) warnings.push(postpone);
      }
    }
    return warnings;
  }, [draftDue, draftStart, siblings, stage]);
  const late = stage.daysLate > 0 && stage.status === "overdue";
  return (
    <article className={stage.isCurrent ? "stage-card current" : "stage-card"}>
      <div className="between">
        <div className="row">
          <b>{name(stage.nameAr, stage.nameEn)}</b>
          {stage.isCustom ? <span className="chip gold">{t("مرحلة خاصة بالإدارة", "Department stage")}</span> : null}
          <span className={`chip ${stage.status}`}>{statusLabel(locale, stage.status)}</span>
          {stage.isCurrent ? <span className="chip gold">{t("المرحلة الحالية", "Current stage")}</span> : null}
          {stage.changed ? <span className="chip gold">{t("موعد معدّل", "Date revised")}</span> : null}
        </div>
        <span className="note">{late ? t(`تجاوز ${daysPhrase(locale, stage.daysLate)}`, `${daysPhrase(locale, stage.daysLate)} late`) : t(`متبقٍ ${daysPhrase(locale, Math.max(stage.daysRemaining, 0))}`, `${daysPhrase(locale, Math.max(stage.daysRemaining, 0))} left`)}</span>
      </div>
      <div className="meta-grid">
        <div><span>{t("مرجعي", "Baseline")}</span><b className="num">{formatDate(stage.baselineStart)} – {formatDate(stage.baselineDue)}</b></div>
        <div><span>{t("مخطط", "Planned")}</span><b className="num">{formatDate(stage.plannedStart)} – {formatDate(stage.plannedDue)}</b></div>
        <div><span>{t("بدء فعلي", "Actual start")}</span><b className="num">{formatDate(stage.actualStart)}</b></div>
        <div><span>{t("إنهاء فعلي", "Completed")}</span><b className="num">{formatDate(stage.completedAt)}</b></div>
      </div>
      {canExecuteStages && !stage.completedAt ? (
        <div className="stack stage-actions">
          <form action={focusAction} className="row">
            <input type="hidden" name="progressId" value={stage.progressId} />
            <input className="input" type="date" name="actualStart" defaultValue={stage.actualStart ?? today} />
            <SubmitButton className="btn btn-ghost btn-sm" label={t("العمل على هذه المرحلة", "Work this stage")} pendingLabel={d.common.saving} />
          </form>
          <form action={doneAction} className="row">
            <input type="hidden" name="progressId" value={stage.progressId} />
            <input className="input" type="date" name="completedAt" defaultValue={today} />
            <SubmitButton className="btn btn-primary btn-sm" label={t("إنهاء المرحلة", "Complete stage")} pendingLabel={d.common.saving} />
          </form>
          <FormMessage result={focusState} />
          <FormMessage result={doneState} />
          {canEditDates ? (
            <button className="btn btn-gold btn-sm" type="button" onClick={() => dialog.current?.showModal()}>{t("تعديل المواعيد مع السبب", "Revise dates with a reason")}</button>
          ) : null}
        </div>
      ) : null}
      {canEditDates && !canExecuteStages && !stage.completedAt ? (
        <button className="btn btn-gold btn-sm" type="button" onClick={() => dialog.current?.showModal()}>{t("تعديل المواعيد مع السبب", "Revise dates with a reason")}</button>
      ) : null}
      {canExecuteStages && stage.completedAt ? (
        <form action={openAction} className="row">
          <input type="hidden" name="progressId" value={stage.progressId} />
          <input className="input" name="reason" placeholder={t("سبب إعادة الفتح", "Reason for reopening")} />
          <SubmitButton className="btn btn-ghost btn-sm" label={t("إعادة فتح", "Reopen")} pendingLabel={d.common.saving} />
          <FormMessage result={openState} />
        </form>
      ) : null}
      {stage.changes.length ? (
        <details>
          <summary>{t("سجل الأسباب", "Reason history")} ({stage.changes.length})</summary>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t("الحقل", "Field")}</th>
                  <th>{t("من", "From")}</th>
                  <th>{t("إلى", "To")}</th>
                  <th>{d.common.reason}</th>
                  <th>{t("المشاهدة", "Seen")}</th>
                </tr>
              </thead>
              <tbody>
                {stage.changes.map((change) => (
                  <tr key={change.id}>
                    <td>{changeKindLabel(locale, change.kind)} · {fieldLabel(locale, change.field)}</td>
                    <td className="num">{formatDate(change.oldDate)}</td>
                    <td className="num">{formatDate(change.newDate)}</td>
                    <td>{change.reason || "—"}<br /><span className="fine">{name(change.actorAr, change.actorEn)} · {formatStamp(change.createdAt, locale)}</span></td>
                    <td>{change.seenAt ? formatStamp(change.seenAt, locale) : t("بانتظار اطلاع القطاع", "Waiting for the Sector")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
      <dialog className="modal" ref={dialog}>
        <form action={datesAction} className="modal-card stack">
          <b>{t("تعديل الموعد المخطط", "Edit the planned dates")}</b>
          <input type="hidden" name="progressId" value={stage.progressId} />
          <label className="field">
            <span>{t("بدء مخطط", "Planned start")}</span>
            <input
              className="input"
              type="date"
              name="plannedStart"
              value={draftStart}
              onChange={(event) => setDraftStart(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>{t("نهو مخطط", "Planned finish")}</span>
            <input
              className="input"
              type="date"
              name="plannedDue"
              value={draftDue}
              onChange={(event) => setDraftDue(event.target.value)}
              required
            />
          </label>
          <label className="field"><span>{d.common.reason} · {d.common.required}</span><textarea className="textarea" name="reason" required minLength={3} /></label>
          {softWarnings.map((item) => (
            <p key={item.code} className="banner warn" role="status">
              {locale === "ar" ? item.ar : item.en}
            </p>
          ))}
          <FormMessage result={datesState} />
          <div className="row">
            <SubmitButton label={d.common.save} pendingLabel={d.common.saving} />
            <button className="btn btn-ghost" type="button" onClick={() => dialog.current?.close()}>{d.common.cancel}</button>
          </div>
        </form>
      </dialog>
    </article>
  );
}

function AssignMore({ operationId, directory, approval }: { operationId: string; directory: Dept[]; approval: string }) {
  const { t, name, d } = useI18n();
  const [state, action] = useActionState(assignDepartmentsAction, null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [amount, setAmount] = useState("0");
  useCloseWhenSaved(state, () => setOpen(false));
  if (!directory.length) return null;
  const payload = picked.map((id) => ({ departmentId: id, approvedAmount: amount, approvalStart: approval, approvalEnd: "" }));
  return (
    <>
      <div>
        <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>{t("تخصيص إدارات أخرى", "Assign more departments")}</button>
      </div>
      <Modal open={open} wide title={t("تخصيص إدارات أخرى", "Assign more departments")} onClose={() => setOpen(false)}>
        <form action={action} className="stack">
          <input type="hidden" name="operationId" value={operationId} />
          <input type="hidden" name="departments" value={JSON.stringify(payload)} />
          <label className="field"><span>{t("قيمة الاعتماد", "Approved amount")}</span><input className="input" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
          <div className="dept-pick">
            {directory.map((item) => (
              <label key={item.id} className={picked.includes(item.id) ? "on" : ""}>
                <input type="checkbox" checked={picked.includes(item.id)} onChange={() => setPicked((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />
                {name(item.nameAr, item.nameEn)}
              </label>
            ))}
          </div>
          <div className="row">
            <SubmitButton className="btn btn-primary" label={d.common.add} pendingLabel={d.common.saving} />
            <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>{d.common.cancel}</button>
          </div>
          <FormMessage result={state?.ok ? null : state} />
        </form>
      </Modal>
    </>
  );
}
