"use client";

import { useActionState, useMemo, useState } from "react";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/lib/format";
import { computeStageWindows, type StageRule } from "@/lib/rules";
import { createOperationAction } from "@/server/actions";
import { FormMessage, SubmitButton } from "./form-bits";
import { SelectBox } from "./select-box";

type TypeOption = { id: string; code: string; nameAr: string; nameEn: string; stages: (StageRule & { nameAr: string; nameEn: string })[] };
type Dept = { id: string; code: string; nameAr: string; nameEn: string };
type Row = { departmentId: string; approvedAmount: string; approvalStart: string; approvalEnd: string };

export function CreateOperationForm({ types, departments }: { types: TypeOption[]; departments: Dept[] }) {
  const { d, t, name } = useI18n();
  const [state, action] = useActionState(createOperationAction, null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [typeId, setTypeId] = useState(types.find((item) => item.code === "EFFICIENCY")?.id ?? types[0]?.id ?? "");
  const [approval, setApproval] = useState("2026-10-08");
  const [query, setQuery] = useState("");
  const [sharedAmount, setSharedAmount] = useState("1000000");
  const [rows, setRows] = useState<Row[]>([]);
  const selected = new Set(rows.map((row) => row.departmentId));
  const type = types.find((item) => item.id === typeId) ?? types[0];
  const windows = useMemo(() => (approval && type ? computeStageWindows(approval, type.stages) : []), [approval, type]);
  const visible = departments.filter((item) => {
    const blob = `${item.nameAr} ${item.nameEn}`.toLowerCase();
    return blob.includes(query.trim().toLowerCase());
  });

  function toggle(id: string) {
    setRows((current) =>
      current.some((row) => row.departmentId === id)
        ? current.filter((row) => row.departmentId !== id)
        : [...current, { departmentId: id, approvedAmount: sharedAmount, approvalStart: approval, approvalEnd: "" }],
    );
  }

  function fillExample() {
    const east = departments.find((item) => item.code === "east-minya");
    setNameAr("تأهيل وتدعيم البوابات والمنشآت المائية بالإدارة العامة لري شرق المنيا");
    setNameEn("Rehabilitation and strengthening of gates and water structures — East Minya");
    setApproval("2026-10-08");
    const efficiency = types.find((item) => item.code === "EFFICIENCY");
    if (efficiency) setTypeId(efficiency.id);
    if (east) setRows([{ departmentId: east.id, approvedAmount: "4750000", approvalStart: "2026-10-08", approvalEnd: "2026-12-30" }]);
  }

  return (
    <form action={action} className="stack">
      <input type="hidden" name="departments" value={JSON.stringify(rows)} />
      <div className="between">
        <p className="note" style={{ margin: 0 }}>{t("العملية الواحدة يمكن تخصيصها لأكثر من إدارة. تاريخ الموافقة هو صفر العداد.", "One operation can be assigned to several departments. The approval date starts every duration.")}</p>
        <button className="btn btn-gold btn-sm" type="button" onClick={fillExample}>{t("تعبئة مثال شرق المنيا", "Fill the East Minya example")}</button>
      </div>
      <div className="grid-2">
        <label className="field">
          <span>{t("اسم العملية", "Operation name")}</span>
          <input className="input" name="nameAr" value={nameAr} onChange={(event) => setNameAr(event.target.value)} required />
        </label>
        <label className="field">
          <span>{t("الاسم بالإنجليزية", "English name")} · {d.common.optional}</span>
          <input className="input" name="nameEn" value={nameEn} onChange={(event) => setNameEn(event.target.value)} />
        </label>
      </div>
      <div className="grid-2">
        <label className="field">
          <span>{t("نوع العملية", "Operation type")}</span>
          <SelectBox name="operationTypeId" value={typeId} onChange={setTypeId} options={types.map((item) => ({ value: item.id, label: name(item.nameAr, item.nameEn) }))} />
        </label>
        <label className="field">
          <span>{t("تاريخ الموافقة الفنية", "Technical approval date")}</span>
          <input className="input" type="date" name="technicalApprovalDate" value={approval} onChange={(event) => setApproval(event.target.value)} required />
        </label>
      </div>
      <div className="card card-pad stack">
        <b>{t("المواعيد المرجعية المحسوبة", "Calculated reference dates")}</b>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t("المرحلة", "Stage")}</th>
                <th>{t("البدء", "Start")}</th>
                <th>{t("النهو", "Finish")}</th>
              </tr>
            </thead>
            <tbody>
              {windows.map((window) => {
                const stage = type?.stages.find((item) => item.code === window.code);
                return (
                  <tr key={window.code}>
                    <td>{stage ? name(stage.nameAr, stage.nameEn) : window.code}</td>
                    <td className="num">{formatDate(window.start)}</td>
                    <td className="num">{formatDate(window.due)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card card-pad stack">
        <div className="between">
          <b>{t("الإدارات المخصصة", "Assigned departments")} ({rows.length})</b>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => setRows((current) => current.map((row) => ({ ...row, approvedAmount: sharedAmount, approvalStart: approval })))}
          >
            {t("تطبيق القيمة وبدء الاعتماد", "Apply amount and approval start")}
          </button>
        </div>
        <div className="grid-2">
          <label className="field">
            <span>{t("بحث في الإدارات", "Search departments")}</span>
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <label className="field">
            <span>{t("قيمة اعتماد مشتركة", "Shared approval amount")}</span>
            <input className="input" value={sharedAmount} onChange={(event) => setSharedAmount(event.target.value)} />
          </label>
        </div>
        <div className="dept-pick">
          {visible.map((department) => (
            <label key={department.id} className={selected.has(department.id) ? "on" : ""}>
              <input type="checkbox" checked={selected.has(department.id)} onChange={() => toggle(department.id)} />
              {name(department.nameAr, department.nameEn)}
            </label>
          ))}
        </div>
        {rows.map((row) => {
          const department = departments.find((item) => item.id === row.departmentId);
          if (!department) return null;
          return (
            <div className="grid-3" key={row.departmentId}>
              <div className="field"><span>{name(department.nameAr, department.nameEn)}</span></div>
              <label className="field">
                <span>{t("قيمة الاعتماد", "Approved amount")}</span>
                <input className="input" value={row.approvedAmount} onChange={(event) => setRows((current) => current.map((item) => item.departmentId === row.departmentId ? { ...item, approvedAmount: event.target.value } : item))} />
              </label>
              <label className="field">
                <span>{t("نهاية الاعتماد", "Approval end")} · {d.common.optional}</span>
                <input className="input" type="date" value={row.approvalEnd} onChange={(event) => setRows((current) => current.map((item) => item.departmentId === row.departmentId ? { ...item, approvalEnd: event.target.value } : item))} />
              </label>
            </div>
          );
        })}
      </div>
      <FormMessage result={state} />
      <div className="row">
        <SubmitButton label={t("إنشاء العملية", "Create operation")} pendingLabel={d.common.saving} />
      </div>
    </form>
  );
}
