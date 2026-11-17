"use client";

import type { CSSProperties } from "react";
import { useI18n } from "@/i18n/context";

export function Spinner({ size = 40, label }: { size?: number; label?: string }) {
  const { t } = useI18n();
  const text = label ?? t("جارٍ التحميل", "Loading");
  return (
    <div className="loader-spin" role="status" aria-live="polite" aria-label={text}>
      <svg className="loader-spin-svg" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <circle className="loader-spin-track" cx="24" cy="24" r="18" />
        <circle className="loader-spin-arc" cx="24" cy="24" r="18" />
        <path className="loader-spin-drop" d="M24 14c0 0 7 8.2 7 12.2a7 7 0 1 1-14 0C17 22.2 24 14 24 14z" />
      </svg>
      <span className="loader-spin-text">{text}</span>
    </div>
  );
}

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function PageLoading({ mode = "table" }: { mode?: "table" | "cards" | "detail" }) {
  const { t } = useI18n();
  return (
    <div className="stack page-loading" aria-busy="true" aria-label={t("جارٍ التحميل", "Loading")}>
      <header className="between page-header">
        <div className="page-header-copy stack" style={{ gap: 8, width: "min(100%, 420px)" }}>
          <Skeleton style={{ width: 88, height: 12 }} />
          <Skeleton style={{ width: "72%", height: 28 }} />
          <Skeleton style={{ width: "92%", height: 14 }} />
        </div>
        <div className="row page-header-actions" style={{ width: "min(100%, 220px)" }}>
          <Skeleton style={{ flex: 1, height: 40, borderRadius: 12 }} />
          <Skeleton style={{ flex: 1, height: 40, borderRadius: 12 }} />
        </div>
      </header>

      {mode !== "detail" ? (
        <div className="filters" aria-hidden="true">
          <Skeleton style={{ height: 42, borderRadius: 12 }} />
          <Skeleton style={{ height: 42, borderRadius: 12 }} />
          <Skeleton style={{ height: 42, borderRadius: 12 }} />
          <Skeleton style={{ height: 42, borderRadius: 12 }} />
        </div>
      ) : null}

      {mode === "cards" ? (
        <div className="stat-grid" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="card card-pad" key={index}>
              <Skeleton style={{ width: "48%", height: 12, marginBottom: 12 }} />
              <Skeleton style={{ width: "36%", height: 28 }} />
            </div>
          ))}
        </div>
      ) : null}

      {mode === "table" || mode === "cards" ? (
        <TableLoading rows={mode === "cards" ? 4 : 6} columns={mode === "cards" ? 3 : 5} />
      ) : (
        <div className="stack">
          <div className="card card-pad stack" aria-hidden="true">
            <Skeleton style={{ width: "40%", height: 16 }} />
            <Skeleton style={{ width: "100%", height: 18 }} />
            <Skeleton style={{ width: "88%", height: 18 }} />
            <Skeleton style={{ width: "70%", height: 18 }} />
          </div>
          <div className="card card-pad loader-panel">
            <Spinner />
          </div>
        </div>
      )}
    </div>
  );
}

export function TableLoading({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  const { t } = useI18n();
  return (
    <div className="table-wrap table-loading" aria-busy="true" aria-label={t("جارٍ تحميل الجدول", "Loading table")}>
      <table className="data">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index}>
                <Skeleton style={{ width: index === 0 ? 96 : 72, height: 12 }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }).map((__, col) => (
                <td key={col}>
                  <Skeleton style={{ width: col === 0 ? "78%" : "56%", height: 12 }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-loading-overlay">
        <Spinner label={t("جارٍ تحميل البيانات", "Loading data")} />
      </div>
    </div>
  );
}
