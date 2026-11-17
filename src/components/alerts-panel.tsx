"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/context";
import { daysPhrase, formatDate, formatStamp } from "@/lib/format";
import { alertLabel } from "@/lib/labels";
import { deleteAlertAction, deleteAlertsBulkAction, restoreAlertAction } from "@/server/actions";
import { BoundForm, FormMessage, SubmitButton } from "./form-bits";
import { Modal } from "./modal";

type AlertVM = {
  id: string;
  type: string;
  operationId: string;
  operationAr: string;
  operationEn: string;
  departmentAr: string;
  departmentEn: string;
  stageAr: string;
  stageEn: string;
  plannedDue: string;
  daysLate: number;
};

type DeletedVM = AlertVM & {
  deletedAt: string | null;
  deletedByAr: string | null;
  deletedByEn: string | null;
};

export function AlertsPanel({
  rows,
  deleted,
  canManage,
  canViewLog,
}: {
  rows: AlertVM[];
  deleted: DeletedVM[];
  canManage: boolean;
  canViewLog: boolean;
}) {
  const { t, name, locale, d } = useI18n();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkState, bulkAction] = useActionState(deleteAlertsBulkAction, null);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="stack">
      {canManage && selected.length > 0 ? (
        <div className="row">
          <button className="btn btn-danger" type="button" onClick={() => setConfirmBulk(true)}>
            {t(`حذف المحدد (${selected.length})`, `Delete selected (${selected.length})`)}
          </button>
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {canManage ? <th /> : null}
              <th>{t("النوع", "Type")}</th>
              <th>{t("العملية", "Operation")}</th>
              <th>{t("الإدارة", "Department")}</th>
              <th>{t("المرحلة", "Stage")}</th>
              <th>{t("الاستحقاق", "Due")}</th>
              <th>{t("التأخير", "Delay")}</th>
              {canManage ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 8 : 6} className="empty">
                  {d.common.empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  {canManage ? (
                    <td>
                      <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggle(row.id)} />
                    </td>
                  ) : null}
                  <td>{alertLabel(locale, row.type as "OVERDUE" | "HALFWAY" | "DUE_SOON")}</td>
                  <td>
                    <a className="link" href={`/operations/${row.operationId}`}>
                      {name(row.operationAr, row.operationEn)}
                    </a>
                  </td>
                  <td>{name(row.departmentAr, row.departmentEn)}</td>
                  <td>{name(row.stageAr, row.stageEn)}</td>
                  <td className="num">{formatDate(row.plannedDue)}</td>
                  <td>{daysPhrase(locale, row.daysLate)}</td>
                  {canManage ? (
                    <td>
                      <BoundForm
                        action={async (prev, formData) => {
                          if (!window.confirm(t("هل أنت متأكد من حذف هذا التنبيه؟", "Are you sure you want to delete this alert?"))) {
                            return prev ?? { ok: false, message: "" };
                          }
                          return deleteAlertAction(prev, formData);
                        }}
                      >
                        <input type="hidden" name="id" value={row.id} />
                        <SubmitButton className="btn btn-danger btn-sm" label={t("حذف", "Delete")} pendingLabel={d.common.saving} />
                      </BoundForm>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={confirmBulk}
        title={t("تأكيد الحذف", "Confirm delete")}
        onClose={() => setConfirmBulk(false)}
      >
        <form action={bulkAction} className="stack">
          {selected.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <p>
            {t(
              `هل أنت متأكد من حذف ${selected.length} تنبيهًا؟`,
              `Are you sure you want to delete ${selected.length} alert(s)?`,
            )}
          </p>
          <div className="row">
            <SubmitButton className="btn btn-danger" label={t("نعم", "Yes")} pendingLabel={d.common.saving} />
            <button className="btn btn-ghost" type="button" onClick={() => setConfirmBulk(false)}>
              {t("لا", "No")}
            </button>
          </div>
          <FormMessage result={bulkState} />
        </form>
      </Modal>

      {canViewLog ? (
        <section className="card card-pad stack">
          <h2>{t("سجل المحذوفات", "Deleted alerts log")}</h2>
          {!canManage ? <p className="note">{t("عرض فقط — لا حذف أو استرجاع.", "Read-only — no delete or restore.")}</p> : null}
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t("العملية", "Operation")}</th>
                  <th>{t("الإدارة", "Department")}</th>
                  <th>{t("حُذف بواسطة", "Deleted by")}</th>
                  <th>{t("متى", "When")}</th>
                  {canManage ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {deleted.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 5 : 4} className="empty">
                      {t("لا تنبيهات محذوفة.", "No deleted alerts.")}
                    </td>
                  </tr>
                ) : (
                  deleted.map((row) => (
                    <tr key={row.id}>
                      <td>{name(row.operationAr, row.operationEn)}</td>
                      <td>{name(row.departmentAr, row.departmentEn)}</td>
                      <td>{row.deletedByAr || row.deletedByEn ? name(row.deletedByAr ?? "", row.deletedByEn ?? "") : "—"}</td>
                      <td className="num">{row.deletedAt ? formatStamp(row.deletedAt, locale) : "—"}</td>
                      {canManage ? (
                        <td>
                          <BoundForm
                            action={async (prev, formData) => {
                              if (!window.confirm(t("استرجاع هذا التنبيه؟", "Restore this alert?"))) {
                                return prev ?? { ok: false, message: "" };
                              }
                              return restoreAlertAction(prev, formData);
                            }}
                          >
                            <input type="hidden" name="id" value={row.id} />
                            <SubmitButton label={t("استرجاع", "Restore")} pendingLabel={d.common.saving} />
                          </BoundForm>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
