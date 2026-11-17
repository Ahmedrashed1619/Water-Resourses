"use client";

import { useActionState, useMemo, useState } from "react";
import { useI18n } from "@/i18n/context";
import { collectNeedRequestWarnings } from "@/lib/needs-rules";
import { createNeedRequestAction } from "@/server/actions";
import { FormMessage, SubmitButton } from "./form-bits";
import { SelectBox } from "./select-box";

type TypeOption = { id: string; nameAr: string; nameEn: string };

export function NeedRequestForm({
  types,
  similarTypeIds,
}: {
  types: TypeOption[];
  similarTypeIds: string[];
}) {
  const { t, d, name } = useI18n();
  const [state, action] = useActionState(createNeedRequestAction, null);
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [desiredStart, setDesiredStart] = useState("");
  const warnings = useMemo(
    () =>
      collectNeedRequestWarnings({
        desiredStartIso: desiredStart || null,
        hasSimilarInSameFy: Boolean(typeId && similarTypeIds.includes(typeId)),
      }),
    [desiredStart, typeId, similarTypeIds],
  );

  return (
    <form action={action} className="card card-pad stack">
      <b>{t("طلب احتياج عملية جديد", "New operation needs request")}</b>
      <p className="note">
        {t(
          "يُرسل الطلب للقطاع للرد بالدعم (موافقة / جزئية / رفض). لا يُنشئ عملية تلقائيًا.",
          "Sent to the Sector for support (approve / partial / reject). Does not auto-create an operation.",
        )}
      </p>
      <div className="grid-2">
        <label className="field">
          <span>{t("نوع العملية", "Operation type")}</span>
          <SelectBox
            name="operationTypeId"
            value={typeId}
            onChange={setTypeId}
            options={types.map((item) => ({ value: item.id, label: name(item.nameAr, item.nameEn) }))}
          />
        </label>
        <label className="field">
          <span>{t("الدعم المطلوب", "Requested support")}</span>
          <SelectBox
            name="requestedSupport"
            defaultValue="BOTH"
            options={[
              { value: "FINANCIAL", label: t("مالي", "Financial") },
              { value: "TECHNICAL", label: t("فني", "Technical") },
              { value: "BOTH", label: t("مالي وفني", "Both") },
            ]}
          />
        </label>
      </div>
      <label className="field">
        <span>{t("عنوان الطلب", "Request title")}</span>
        <input className="input" name="title" required minLength={3} />
      </label>
      <label className="field">
        <span>{t("المتطلبات", "Requirements")}</span>
        <textarea className="input" name="requirements" rows={4} required minLength={3} />
      </label>
      <label className="field">
        <span>
          {t("الوصف", "Description")} · {d.common.optional}
        </span>
        <textarea className="input" name="description" rows={3} />
      </label>
      <div className="grid-3">
        <label className="field">
          <span>
            {t("القيمة التقديرية", "Estimated value")} · {d.common.optional}
          </span>
          <input className="input" name="estimatedValue" placeholder="0.00" />
        </label>
        <label className="field">
          <span>
            {t("تاريخ البدء المرغوب", "Desired start")} · {d.common.optional}
          </span>
          <input className="input" type="date" name="desiredStartDate" value={desiredStart} onChange={(e) => setDesiredStart(e.target.value)} />
        </label>
        <label className="field">
          <span>
            {t("المدة المتوقعة (أيام)", "Expected duration (days)")} · {d.common.optional}
          </span>
          <input className="input" type="number" name="expectedDurationDays" min={1} />
        </label>
      </div>
      {warnings.length ? (
        <ul className="stack" style={{ margin: 0, paddingInlineStart: "1.2rem" }}>
          {warnings.map((item) => (
            <li key={item.code} className="banner warn">
              {name(item.ar, item.en)}
            </li>
          ))}
        </ul>
      ) : null}
      <SubmitButton label={t("إرسال الطلب", "Submit request")} pendingLabel={d.common.saving} />
      <FormMessage result={state} />
    </form>
  );
}
