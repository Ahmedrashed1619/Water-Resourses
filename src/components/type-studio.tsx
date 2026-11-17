"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/context";
import { createTypeAction, deleteTypeAction, restoreTypeAction } from "@/server/actions";
import { BoundForm, FormMessage, SubmitButton } from "./form-bits";
import { Modal, useCloseWhenSaved } from "./modal";

type OpType = {
  id: string;
  nameAr: string;
  nameEn: string;
  isSystem: boolean;
  deletedAt: string | null;
  deletedByName: string | null;
};

export function TypeStudio({ types }: { types: OpType[] }) {
  const { t, name, d } = useI18n();
  const [creatingType, setCreatingType] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<OpType | null>(null);
  const active = types.filter((item) => !item.deletedAt);
  const deleted = types.filter((item) => item.deletedAt);

  return (
    <section className="stack" id="types">
      <div className="between">
        <div>
          <h2>{t("أنواع العمليات", "Operation types")}</h2>
          <p className="note">
            {t(
              "قائمة الأنواع فقط. النوع الجديد يأخذ المراحل الافتراضية تلقائيًا. لا تعديل للمراحل أو المدد من هنا.",
              "Types list only. A new type gets the default stages automatically. No stage or duration editing here.",
            )}
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setCreatingType(true)}>
          {t("نوع جديد", "New type")}
        </button>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t("النوع", "Type")}</th>
              <th>{t("التصنيف", "Kind")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {active.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty">
                  {t("لا أنواع.", "No types.")}
                </td>
              </tr>
            ) : (
              active.map((type) => (
                <tr key={type.id}>
                  <td>{name(type.nameAr, type.nameEn)}</td>
                  <td>
                    {type.isSystem ? (
                      <span className="chip gold">{t("أساسي", "Core")}</span>
                    ) : (
                      <span className="chip">{t("مضاف", "Added")}</span>
                    )}
                  </td>
                  <td>
                    {!type.isSystem ? (
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => setPendingDelete(type)}>
                        {d.common.delete}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section className="card card-pad stack">
        <h2>{t("سجل المحذوفات", "Recycle bin")}</h2>
        {deleted.length === 0 ? (
          <p className="empty">{t("لا أنواع محذوفة.", "No deleted types.")}</p>
        ) : (
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
      <DeleteTypeModal type={pendingDelete} onClose={() => setPendingDelete(null)} />
    </section>
  );
}

function DeleteTypeModal({ type, onClose }: { type: OpType | null; onClose: () => void }) {
  const { t, d, name } = useI18n();
  const [state, action] = useActionState(deleteTypeAction, null);
  useCloseWhenSaved(state, onClose);
  return (
    <Modal
      open={Boolean(type)}
      title={t("حذف نوع العملية؟", "Delete this operation type?")}
      subtitle={type ? name(type.nameAr, type.nameEn) : undefined}
      onClose={onClose}
    >
      <form action={action} className="stack">
        <input type="hidden" name="id" value={type?.id ?? ""} />
        <p className="note">
          {t("هل أنت متأكد من حذف هذا النوع؟ نعم / لا — العمليات الحالية تبقى تعمل.", "Are you sure? Yes / No — existing operations keep working.")}
        </p>
        <div className="row">
          <SubmitButton className="btn btn-danger" label={t("نعم", "Yes")} pendingLabel={d.common.saving} />
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            {t("لا", "No")}
          </button>
        </div>
        <FormMessage result={state} />
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
        <label className="field">
          <span>{t("الاسم", "Name")}</span>
          <input className="input" name="nameAr" required />
        </label>
        <label className="field">
          <span>{t("الاسم بالإنجليزية", "English name")}</span>
          <input className="input" name="nameEn" />
        </label>
        <input type="hidden" name="copyDefaults" value="1" />
        <p className="note">{t("تُنسخ المراحل الأربع الافتراضية تلقائيًا.", "The four default stages are copied automatically.")}</p>
        <div className="row">
          <SubmitButton label={d.common.add} pendingLabel={d.common.saving} />
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            {d.common.cancel}
          </button>
        </div>
        <FormMessage result={state} />
      </form>
    </Modal>
  );
}
