"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/context";
import { createTypeAction, deleteTypeAction, restoreTypeAction } from "@/server/actions";
import { BoundForm, FormMessage, SubmitButton } from "./form-bits";
import { Modal, useCloseWhenSaved } from "./modal";
import { ActionIcon, ConfirmPopover } from "./table-actions";

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
                  <td className="table-actions-cell">
                    {!type.isSystem ? (
                      <BoundForm action={deleteTypeAction} silent>
                        <input type="hidden" name="id" value={type.id} />
                        <ConfirmPopover
                          tip={d.common.delete}
                          title={t("حذف نوع العملية؟", "Delete this operation type?")}
                          message={t(
                            `هل أنت متأكد من حذف «${name(type.nameAr, type.nameEn)}»؟ العمليات الحالية تبقى تعمل.`,
                            `Delete “${name(type.nameAr, type.nameEn)}”? Existing operations keep working.`,
                          )}
                          confirmLabel={t("نعم، احذف", "Yes, delete")}
                        />
                      </BoundForm>
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
                    <td className="table-actions-cell">
                      <BoundForm action={restoreTypeAction} silent>
                        <input type="hidden" name="id" value={type.id} />
                        <ActionIcon tip={t("استرجاع", "Restore")} icon="restore" tone="primary" type="submit" />
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
