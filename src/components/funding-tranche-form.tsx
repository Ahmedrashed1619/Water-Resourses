"use client";

import { useActionState } from "react";
import { useI18n } from "@/i18n/context";
import { addFundingTrancheAction } from "@/server/actions";
import { FormMessage, SubmitButton } from "./form-bits";

export function FundingTrancheForm({ operationDepartmentId }: { operationDepartmentId: string }) {
  const { t, d } = useI18n();
  const [state, action] = useActionState(addFundingTrancheAction, null);
  return (
    <form action={action} className="card card-pad stack">
      <b>{t("تعديل فترة الاعتماد — دفعة جديدة", "Edit funding period — new tranche")}</b>
      <p className="note">{t("دفعة اعتماد من القطاع إلى الإدارة (ليست دفعة مقدمة للمقاول).", "A Sector→Department funding tranche (not a contractor advance payment).")}</p>
      <input type="hidden" name="operationDepartmentId" value={operationDepartmentId} />
      <div className="grid-3">
        <label className="field">
          <span>{t("تاريخ الإرسال", "Sent date")}</span>
          <input className="input" type="date" name="sentAt" required />
        </label>
        <label className="field">
          <span>{t("المبلغ", "Amount")}</span>
          <input className="input" name="amount" required placeholder="0.00" />
        </label>
        <label className="field">
          <span>{t("ملاحظة", "Note")} · {d.common.optional}</span>
          <input className="input" name="note" />
        </label>
      </div>
      <SubmitButton label={t("إضافة دفعة اعتماد", "Add funding tranche")} pendingLabel={d.common.saving} />
      <FormMessage result={state} />
    </form>
  );
}
