"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/i18n/context";
import { daysPhrase, formatDate, formatLongDate } from "@/lib/format";
import { alertLabel } from "@/lib/labels";
import { todayISO } from "@/lib/dates";
import type { AlertRow } from "@/lib/view";

export function ReportStudio({ rows, query }: { rows: AlertRow[]; query: string }) {
  const sheet = useRef<HTMLDivElement>(null);
  const { locale, t, name, d } = useI18n();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function downloadPng() {
    if (!sheet.current) return;
    setBusy(true);
    setError("");
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(sheet.current, { pixelRatio: 2, backgroundColor: "#fffdf8", cacheBust: true });
      const link = document.createElement("a");
      link.href = url;
      link.download = "operio-alerts.png";
      link.click();
    } catch {
      setError(t("تعذر إنشاء الصورة من هذه الشاشة.", "The image could not be created from this screen."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="row report-actions">
        <a className="btn btn-primary" href={`/api/reports/excel${query}`}>
          {t("تنزيل جدول Excel", "Download Excel table")}
        </a>
        <a className="btn btn-ghost" href={`/api/reports/word${query}`}>
          {t("تنزيل مستند Word", "Download Word document")}
        </a>
        <button className="btn btn-gold" type="button" onClick={downloadPng} disabled={busy}>
          {busy ? d.common.saving : t("تنزيل صورة", "Download image")}
        </button>
      </div>
      {error ? <p className="banner err">{error}</p> : null}
      <div className="sheet" ref={sheet}>
        <div className="sheet-head">
          <div>
            <div className="sheet-kicker">{locale === "ar" ? "وزارة الموارد المائية والري · قطاع الري" : "Ministry of Water Resources and Irrigation · Irrigation Sector"}</div>
            <h2 style={{ margin: "4px 0" }}>{t("تنبيهات تجاوز المدة", "Overdue alerts")}</h2>
            <div>{formatLongDate(todayISO(), locale)} · {rows.length}</div>
          </div>
          <img src="/brand/sector.jpg" alt="" width={72} height={72} />
        </div>
        <table>
          <thead>
            <tr>
              <th>{t("العملية", "Operation")}</th>
              <th>{t("الإدارة", "Department")}</th>
              <th>{t("المرحلة", "Stage")}</th>
              <th>{t("الاستحقاق", "Due")}</th>
              <th>{t("التأخير", "Delay")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5}>{d.common.empty}</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id}>
                <td>{name(row.operationAr, row.operationEn)}</td>
                <td>{name(row.departmentAr, row.departmentEn)}</td>
                <td>{name(row.stageAr, row.stageEn)}<br />{alertLabel(locale, row.type)}</td>
                <td>{formatDate(row.plannedDue)}</td>
                <td>{daysPhrase(locale, row.daysLate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
