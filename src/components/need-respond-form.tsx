"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/context";
import { respondNeedRequestAction } from "@/server/actions";
import { FormMessage, SubmitButton } from "./form-bits";
import { SelectBox } from "./select-box";

type OpOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  assignments: { id: string; departmentId: string; department: { nameAr: string; nameEn: string } }[];
};

export function NeedRespondForm({
  requestId,
  departmentId,
  operations,
}: {
  requestId: string;
  departmentId: string;
  operations: OpOption[];
}) {
  const { t, d, name } = useI18n();
  const [state, action] = useActionState(respondNeedRequestAction, null);
  const [opId, setOpId] = useState("");
  const selected = operations.find((item) => item.id === opId);
  const deptAssignments = selected?.assignments.filter((a) => a.departmentId === departmentId) ?? [];

  return (
    <form action={action} className="card card-pad stack">
      <b>{t("رد القطاع على الطلب", "Sector response")}</b>
      <p className="note">
        {t(
          "الموافقة لا تُنشئ عملية تلقائيًا — أنشئ العملية من صفحة العمليات عند الحاجة، ويمكن ربطها هنا اختياريًا.",
          "Approval does not auto-create an operation — create it from Operations when needed, then optionally link it here.",
        )}
      </p>
      <input type="hidden" name="id" value={requestId} />
      <label className="field">
        <span>{t("القرار", "Decision")}</span>
        <SelectBox
          name="decision"
          defaultValue="APPROVED"
          options={[
            { value: "APPROVED", label: t("موافقة", "Approve") },
            { value: "PARTIALLY_APPROVED", label: t("موافقة جزئية", "Partial approve") },
            { value: "REJECTED", label: t("رفض", "Reject") },
          ]}
        />
      </label>
      <label className="field">
        <span>
          {t("ملاحظات الرد", "Decision notes")} · {d.common.optional}
        </span>
        <textarea className="input" name="decisionNote" rows={3} />
      </label>
      <label className="field">
        <span>
          {t("المبلغ المعتمد", "Approved amount")} · {d.common.optional}
        </span>
        <input className="input" name="approvedAmount" placeholder="0.00" />
      </label>
      <label className="field">
        <span>
          {t("ربط بعملية قائمة", "Link existing operation")} · {d.common.optional}
        </span>
        <SelectBox
          name="linkedOperationId"
          value={opId}
          onChange={setOpId}
          options={[
            { value: "", label: t("بدون ربط", "No link") },
            ...operations.map((item) => ({ value: item.id, label: name(item.nameAr, item.nameEn) })),
          ]}
        />
      </label>
      {deptAssignments.length ? (
        <div className="stack">
          <b>{t("دفعة اعتماد اختيارية", "Optional funding tranche")}</b>
          <label className="field">
            <span>{t("تخصيص الإدارة في العملية", "Department assignment")}</span>
            <SelectBox
              name="trancheOperationDepartmentId"
              defaultValue=""
              options={[
                { value: "", label: t("بدون دفعة", "No tranche") },
                ...deptAssignments.map((a) => ({
                  value: a.id,
                  label: name(a.department.nameAr, a.department.nameEn),
                })),
              ]}
            />
          </label>
          <div className="grid-3">
            <label className="field">
              <span>{t("تاريخ الإرسال", "Sent date")}</span>
              <input className="input" type="date" name="trancheSentAt" />
            </label>
            <label className="field">
              <span>{t("المبلغ", "Amount")}</span>
              <input className="input" name="trancheAmount" placeholder="0.00" />
            </label>
            <label className="field">
              <span>
                {t("ملاحظة", "Note")} · {d.common.optional}
              </span>
              <input className="input" name="trancheNote" />
            </label>
          </div>
        </div>
      ) : null}
      <SubmitButton label={t("حفظ الرد", "Save response")} pendingLabel={d.common.saving} />
      <FormMessage result={state} />
    </form>
  );
}
