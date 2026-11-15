"use client";

import type { ReactNode } from "react";
import { statusHint, statusLabel } from "@/lib/labels";
import type { StageVisualStatus } from "@/lib/rules";
import type { Locale } from "@/lib/text";
import { diffDays } from "@/lib/dates";
import { Tip } from "./tip";

export function PageHeader({ kicker, title, lede, children }: { kicker?: string; title: string; lede?: string; children?: ReactNode }) {
  return (
    <header className="between">
      <div>
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
      </div>
      {children ? <div className="row">{children}</div> : null}
    </header>
  );
}

export function StatusChip({ locale, status }: { locale: Locale; status: StageVisualStatus | "idle" }) {
  return (
    <Tip text={statusHint(locale, status)}>
      <span className={`chip ${status}`}>{statusLabel(locale, status)}</span>
    </Tip>
  );
}

export function StageTrack({ rows }: { rows: { name: string; start: string; due: string; status: string }[] }) {
  if (!rows.length) return null;
  const min = [...rows.map((row) => row.start)].sort()[0];
  const max = [...rows.map((row) => row.due)].sort().at(-1) ?? min;
  const span = Math.max(diffDays(min, max), 1);
  return (
    <div className="track">
      {rows.map((row, index) => {
        const start = (diffDays(min, row.start) / span) * 100;
        const width = Math.max((diffDays(row.start, row.due) / span) * 100, 2.2);
        return (
          <div className="track-row" key={`${row.name}-${index}`}>
            <span className="track-name">{row.name}</span>
            <div className="track-bar">
              <span className={`track-fill ${row.status}`} style={{ insetInlineStart: `${start}%`, width: `${Math.min(width, 100 - start)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
