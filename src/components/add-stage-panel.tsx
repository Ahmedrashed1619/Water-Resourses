"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/context";
import type { AssignmentVM } from "@/lib/view";
import { addStageToAssignmentAction, createDepartmentStageTypeAction } from "@/server/actions";
import { FormMessage, SubmitButton } from "./form-bits";
import { Modal, useCloseWhenSaved } from "./modal";

export function AddStagePanel({
  assignment,
  canAddStage,
  canCreateStageType,
  today,
}: {
  assignment: AssignmentVM;
  canAddStage: boolean;
  canCreateStageType: boolean;
  today: string;
}) {
  const { t, name, d } = useI18n();
  const available = assignment.availableStages ?? [];
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">(canAddStage && available.length ? "existing" : "new");
  const [addState, addAction] = useActionState(addStageToAssignmentAction, null);
  const [createState, createAction] = useActionState(createDepartmentStageTypeAction, null);
  const close = () => setOpen(false);
  useCloseWhenSaved(addState, close);
  useCloseWhenSaved(createState, close);
  const showExisting = canAddStage && available.length > 0;
  const showNew = canCreateStageType && canAddStage;
  if (!showExisting && !showNew) return null;
  const activeMode = mode === "existing" && !showExisting ? "new" : mode === "new" && !showNew ? "existing" : mode;
  const dates = (
    <div className="grid-2">
      <label className="field">
        <span>
          {t("بدء مخطط", "Planned start")} · {d.common.required}
        </span>
        <input className="input" type="date" name="plannedStart" defaultValue={today} required />
      </label>
      <label className="field">
        <span>
          {t("نهو مخطط", "Planned finish")} · {d.common.required}
        </span>
        <input className="input" type="date" name="plannedDue" defaultValue={today} required />
      </label>
    </div>
  );
  return (
    <>
      <div>
        <button className="btn btn-gold btn-sm" type="button" onClick={() => setOpen(true)}>
          {t("إضافة مرحلة", "Add a stage")}
        </button>
      </div>
      <Modal
        open={open}
        wide
        title={t("إضافة مرحلة للعملية", "Add a stage to this operation")}
        subtitle={name(assignment.departmentAr, assignment.departmentEn)}
        onClose={close}
      >
        <div className="stack">
          {showExisting && showNew ? (
            <div className="row">
              <button
                className={activeMode === "existing" ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
                type="button"
                onClick={() => setMode("existing")}
              >
                {t("مرحلة موجودة", "Existing stage")}
              </button>
              <button
                className={activeMode === "new" ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
                type="button"
                onClick={() => setMode("new")}
              >
                {t("نوع مرحلة جديد", "New custom stage")}
              </button>
            </div>
          ) : null}
          {activeMode === "existing" ? (
            <form action={addAction} className="stack">
              <input type="hidden" name="operationDepartmentId" value={assignment.id} />
              <label className="field">
                <span>{t("المرحلة", "Stage")}</span>
                <select className="input" name="stageDefinitionId" required defaultValue="">
                  <option value="" disabled>
                    {t("اختر مرحلة", "Choose a stage")}
                  </option>
                  {available.map((item) => (
                    <option key={item.id} value={item.id}>
                      {name(item.nameAr, item.nameEn)}
                      {item.isCustom ? ` · ${t("خاصة بالإدارة", "department")}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              {dates}
              <label className="field">
                <span>
                  {t("ملاحظة", "Note")} · {d.common.optional}
                </span>
                <input className="input" name="note" />
              </label>
              <div className="row">
                <SubmitButton className="btn btn-primary" label={d.common.add} pendingLabel={d.common.saving} />
                <button className="btn btn-ghost" type="button" onClick={close}>
                  {d.common.cancel}
                </button>
              </div>
              <FormMessage result={addState?.ok ? null : addState} />
            </form>
          ) : (
            <form action={createAction} className="stack">
              <input type="hidden" name="operationDepartmentId" value={assignment.id} />
              <div className="grid-2">
                <label className="field">
                  <span>
                    {t("اسم المرحلة", "Stage name")} · {d.common.required}
                  </span>
                  <input className="input" name="nameAr" required minLength={2} />
                </label>
                <label className="field">
                  <span>
                    {t("الاسم بالإنجليزية", "English name")} · {d.common.optional}
                  </span>
                  <input className="input" name="nameEn" />
                </label>
              </div>
              {dates}
              <label className="field">
                <span>
                  {t("ملاحظة", "Note")} · {d.common.optional}
                </span>
                <input className="input" name="note" />
              </label>
              <p className="note">
                {t(
                  "تظهر المرحلة الجديدة لإدارتك فقط في هذا النوع من العمليات، ويطلع عليها القطاع للقراءة.",
                  "The new stage is available to your department only for this operation type; the Sector sees it read-only.",
                )}
              </p>
              <div className="row">
                <SubmitButton className="btn btn-primary" label={t("إنشاء وإضافة", "Create and add")} pendingLabel={d.common.saving} />
                <button className="btn btn-ghost" type="button" onClick={close}>
                  {d.common.cancel}
                </button>
              </div>
              <FormMessage result={createState?.ok ? null : createState} />
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}
