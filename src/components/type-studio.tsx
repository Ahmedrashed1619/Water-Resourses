"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/context";
import { createStageAction, createTypeAction, deleteTypeAction, restoreTypeAction, updateStageAction } from "@/server/actions";
import { BoundForm, FormMessage, SubmitButton } from "./form-bits";
import { Modal, useCloseWhenSaved } from "./modal";
import { SelectBox } from "./select-box";

type Stage = {
  id: string;
  nameAr: string;
  nameEn: string;
  durationMonths: number;
  durationDays: number;
  anchor: string;
};

type OpType = {
  id: string;
  nameAr: string;
  nameEn: string;
  isSystem: boolean;
  deletedAt: string | null;
  deletedByName: string | null;
  stages: Stage[];
};

export function TypeStudio({ types }: { types: OpType[] }) {
  const { t, name, d } = useI18n();
  const [creatingType, setCreatingType] = useState(false);
  const [stageFor, setStageFor] = useState<string | null>(null);
  const [editing, setEditing] = useState<Stage | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OpType | null>(null);
  const active = types.filter((item) => !item.deletedAt);
  const deleted = types.filter((item) => item.deletedAt);

  return (
    <section className="stack" id="types">
      <div className="between">
        <div>
          <h2>{t("أنواع العمليات", "Operation types")}</h2>
          <p className="note">{t("الأنواع الأساسية ثابتة. الأنواع المضافة يمكن حذفها إلى سجل المحذوفات واسترجاعها.", "Core types stay. Custom types can be soft-deleted to the recycle bin and restored.")}</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setCreatingType(true)}>{t("نوع جديد", "New type")}</button>
      </div>
      {active.map((type) => (
        <article key={type.id} className="card card-pad stack">
          <div className="between">
            <div className="row">
              <h3>{name(type.nameAr, type.nameEn)}</h3>
              {type.isSystem ? <span className="chip gold">{t("أساسي", "Core")}</span> : <span className="chip">{t("مضاف", "Added")}</span>}
            </div>
            <div className="row">
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setStageFor(type.id)}>{t("مرحلة جديدة", "New stage")}</button>
              {!type.isSystem ? (
                <button className="btn btn-danger btn-sm" type="button" onClick={() => setPendingDelete(type)}>{d.common.delete}</button>
              ) : null}
            </div>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t("المرحلة", "Stage")}</th>
                  <th>{t("المدة", "Duration")}</th>
                  <th>{t("تُحسب من", "Counted from")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {type.stages.map((stage) => (
                  <tr key={stage.id}>
                    <td>{name(stage.nameAr, stage.nameEn)}</td>
                    <td className="num">{stage.durationMonths} {t("شهر", "months")} + {stage.durationDays} {t("يوم", "days")}</td>
                    <td>{stage.anchor === "FINANCIAL_OPENING" ? t("نهو الفتح المالي", "Financial opening due") : t("تاريخ الموافقة", "Approval date")}</td>
                    <td><button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(stage)}>{t("تعديل", "Edit")}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}

      <section className="card card-pad stack">
        <h2>{t("سجل المحذوفات", "Recycle bin")}</h2>
        {deleted.length === 0 ? <p className="empty">{t("لا أنواع محذوفة.", "No deleted types.")}</p> : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t("النوع", "Type")}</th>
                  <th>{t("حُذف بواسطة", "Deleted by")}</th>
                  <th>{t("التاريخ", "Date")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {deleted.map((type) => (
                  <tr key={type.id}>
                    <td>{name(type.nameAr, type.nameEn)}</td>
                    <td>{type.deletedByName ?? "—"}</td>
                    <td className="num">{type.deletedAt ? new Date(type.deletedAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <BoundForm action={restoreTypeAction} className="row">
                        <input type="hidden" name="id" value={type.id} />
                        <SubmitButton label={t("استرجاع", "Restore")} pendingLabel={d.common.saving} />
                      </BoundForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <TypeModal open={creatingType} onClose={() => setCreatingType(false)} />
      <StageCreateModal typeId={stageFor} onClose={() => setStageFor(null)} />
      <StageEditModal stage={editing} onClose={() => setEditing(null)} />
      <DeleteTypeModal type={pendingDelete} onClose={() => setPendingDelete(null)} />
    </section>
  );
}

function DeleteTypeModal({ type, onClose }: { type: OpType | null; onClose: () => void }) {
  const { t, d, name } = useI18n();
  const [state, action] = useActionState(deleteTypeAction, null);
  useCloseWhenSaved(state, onClose);
  return (
    <Modal open={Boolean(type)} title={t("تأكيد الحذف", "Confirm delete")} onClose={onClose}>
      <form action={action} className="stack">
        <input type="hidden" name="id" value={type?.id ?? ""} />
        <p>{t("هل أنت متأكد من حذف نوع العملية؟", "Are you sure you want to delete this operation type?")}</p>
        <p className="note"><b>{type ? name(type.nameAr, type.nameEn) : ""}</b></p>
        <div className="row">
          <SubmitButton label={t("نعم", "Yes")} pendingLabel={d.common.saving} />
          <button className="btn btn-ghost" type="button" onClick={onClose}>{t("لا", "No")}</button>
        </div>
        <FormMessage result={state?.ok ? null : state} />
      </form>
    </Modal>
  );
}

function TypeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, d } = useI18n();
  const [state, action] = useActionState(createTypeAction, null);
  useCloseWhenSaved(state, onClose);
  return (
    <Modal open={open} title={t("نوع عملية جديد", "New operation type")} onClose={onClose}>
      <form action={action} className="stack">
        <label className="field"><span>{t("الاسم", "Name")}</span><input className="input" name="nameAr" required /></label>
        <label className="field"><span>{t("الاسم بالإنجليزية", "English name")}</span><input className="input" name="nameEn" /></label>
        <label className="checkline"><input type="checkbox" name="copyDefaults" defaultChecked /> {t("نسخ المراحل الأربع الافتراضية", "Copy the four default stages")}</label>
        <div className="row">
          <SubmitButton label={d.common.add} pendingLabel={d.common.saving} />
          <button className="btn btn-ghost" type="button" onClick={onClose}>{d.common.cancel}</button>
        </div>
        <FormMessage result={state?.ok ? null : state} />
      </form>
    </Modal>
  );
}

function StageCreateModal({ typeId, onClose }: { typeId: string | null; onClose: () => void }) {
  const { t, d } = useI18n();
  const [state, action] = useActionState(createStageAction, null);
  useCloseWhenSaved(state, onClose);
  return (
    <Modal open={Boolean(typeId)} title={t("مرحلة جديدة", "New stage")} onClose={onClose}>
      <form action={action} className="stack">
        <input type="hidden" name="typeId" value={typeId ?? ""} />
        <label className="field"><span>{t("الاسم", "Name")}</span><input className="input" name="nameAr" required /></label>
        <label className="field"><span>{t("الاسم بالإنجليزية", "English name")}</span><input className="input" name="nameEn" /></label>
        <div className="grid-2">
          <label className="field"><span>{t("شهور", "Months")}</span><input className="input" type="number" min={0} name="months" defaultValue={0} /></label>
          <label className="field"><span>{t("أيام", "Days")}</span><input className="input" type="number" min={0} name="days" defaultValue={7} /></label>
        </div>
        <label className="field">
          <span>{t("تُحسب من", "Counted from")}</span>
          <SelectBox
            name="anchor"
            defaultValue="APPROVAL"
            options={[
              { value: "APPROVAL", label: t("تاريخ الموافقة", "Approval date") },
              { value: "FINANCIAL_OPENING", label: t("نهو الفتح المالي", "Financial opening due") },
            ]}
          />
        </label>
        <div className="row">
          <SubmitButton label={d.common.add} pendingLabel={d.common.saving} />
          <button className="btn btn-ghost" type="button" onClick={onClose}>{d.common.cancel}</button>
        </div>
        <FormMessage result={state?.ok ? null : state} />
      </form>
    </Modal>
  );
}

function StageEditModal({ stage, onClose }: { stage: Stage | null; onClose: () => void }) {
  const { t, d } = useI18n();
  const [state, action] = useActionState(updateStageAction, null);
  useCloseWhenSaved(state, onClose);
  return (
    <Modal open={Boolean(stage)} title={t("تعديل المرحلة", "Edit stage")} onClose={onClose}>
      <form action={action} className="stack">
        <input type="hidden" name="id" value={stage?.id ?? ""} />
        <label className="field"><span>{t("الاسم", "Name")}</span><input className="input" name="nameAr" defaultValue={stage?.nameAr ?? ""} required /></label>
        <label className="field"><span>{t("الاسم بالإنجليزية", "English name")}</span><input className="input" name="nameEn" defaultValue={stage?.nameEn ?? ""} /></label>
        <div className="grid-2">
          <label className="field"><span>{t("شهور", "Months")}</span><input className="input" type="number" min={0} name="months" defaultValue={stage?.durationMonths ?? 0} /></label>
          <label className="field"><span>{t("أيام", "Days")}</span><input className="input" type="number" min={0} name="days" defaultValue={stage?.durationDays ?? 0} /></label>
        </div>
        <label className="field">
          <span>{t("تُحسب من", "Counted from")}</span>
          <SelectBox
            name="anchor"
            defaultValue={stage?.anchor ?? "APPROVAL"}
            options={[
              { value: "APPROVAL", label: t("تاريخ الموافقة", "Approval date") },
              { value: "FINANCIAL_OPENING", label: t("نهو الفتح المالي", "Financial opening due") },
            ]}
          />
        </label>
        <div className="row">
          <SubmitButton label={d.common.save} pendingLabel={d.common.saving} />
          <button className="btn btn-ghost" type="button" onClick={onClose}>{d.common.cancel}</button>
        </div>
        <FormMessage result={state?.ok ? null : state} />
      </form>
    </Modal>
  );
}
