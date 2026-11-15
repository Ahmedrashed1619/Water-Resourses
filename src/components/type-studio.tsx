"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/context";
import { createStageAction, createTypeAction, updateStageAction } from "@/server/actions";
import { FormMessage, SubmitButton } from "./form-bits";
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
  stages: Stage[];
};

export function TypeStudio({ types }: { types: OpType[] }) {
  const { t, name } = useI18n();
  const [creatingType, setCreatingType] = useState(false);
  const [stageFor, setStageFor] = useState<string | null>(null);
  const [editing, setEditing] = useState<Stage | null>(null);

  return (
    <section className="stack">
      <div className="between">
        <div>
          <h2>{t("أنواع العمليات", "Operation types")}</h2>
          <p className="note">{t("الأنواع الأربعة ثابتة. أي نوع أو مرحلة جديدة تُضاف من النافذة، وتسري على العمليات القادمة.", "The four core types stay. New types and stages are added from a window and apply to future operations.")}</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setCreatingType(true)}>{t("نوع جديد", "New type")}</button>
      </div>
      {types.map((type) => (
        <article key={type.id} className="card card-pad stack">
          <div className="between">
            <div className="row">
              <h3>{name(type.nameAr, type.nameEn)}</h3>
              {type.isSystem ? <span className="chip gold">{t("أساسي", "Core")}</span> : <span className="chip">{t("مضاف", "Added")}</span>}
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setStageFor(type.id)}>{t("مرحلة جديدة", "New stage")}</button>
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
      <TypeModal open={creatingType} onClose={() => setCreatingType(false)} />
      <StageCreateModal typeId={stageFor} onClose={() => setStageFor(null)} />
      <StageEditModal stage={editing} onClose={() => setEditing(null)} />
    </section>
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
              { value: "FINANCIAL_OPENING", label: t("نهو الفتح المالي المرجعي", "Financial-opening reference") },
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
    <Modal open={Boolean(stage)} title={t("تعديل المرحلة", "Edit stage")} subtitle={t("يسري على العمليات الجديدة. المواعيد المرجعية الصادرة تبقى كما هي.", "Applies to new operations. Issued reference dates stay as they are.")} onClose={onClose}>
      {stage ? (
        <form action={action} className="stack" key={stage.id}>
          <input type="hidden" name="id" value={stage.id} />
          <label className="field"><span>{t("الاسم", "Name")}</span><input className="input" name="nameAr" defaultValue={stage.nameAr} required /></label>
          <label className="field"><span>{t("الاسم بالإنجليزية", "English name")}</span><input className="input" name="nameEn" defaultValue={stage.nameEn} /></label>
          <div className="grid-2">
            <label className="field"><span>{t("شهور", "Months")}</span><input className="input" type="number" min={0} name="months" defaultValue={stage.durationMonths} /></label>
            <label className="field"><span>{t("أيام إضافية", "Extra days")}</span><input className="input" type="number" min={0} name="days" defaultValue={stage.durationDays} /></label>
          </div>
          <label className="field">
            <span>{t("تُحسب من", "Counted from")}</span>
            <SelectBox
              name="anchor"
              defaultValue={stage.anchor}
              options={[
                { value: "APPROVAL", label: t("تاريخ الموافقة", "Approval date") },
                { value: "FINANCIAL_OPENING", label: t("نهو الفتح المالي المرجعي", "Financial-opening reference") },
              ]}
            />
          </label>
          <div className="row">
            <SubmitButton label={d.common.save} pendingLabel={d.common.saving} />
            <button className="btn btn-ghost" type="button" onClick={onClose}>{d.common.cancel}</button>
          </div>
          <FormMessage result={state?.ok ? null : state} />
        </form>
      ) : null}
    </Modal>
  );
}
