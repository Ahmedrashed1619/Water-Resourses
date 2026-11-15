"use client";

import type { ReactNode } from "react";

export function ChartShell({
  title,
  description,
  labelId,
  descId,
  liveId,
  liveText,
  actions,
  empty,
  isEmpty,
  children,
}: {
  title: string;
  description: string;
  labelId: string;
  descId: string;
  liveId: string;
  liveText: string;
  actions?: ReactNode;
  empty: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <article className="card card-pad chart-card" aria-labelledby={labelId} aria-describedby={descId}>
      <div className="chart-head between">
        <div className="stack" style={{ gap: 2 }}>
          <h2 id={labelId}>{title}</h2>
          <p id={descId} className="chart-desc">{description}</p>
        </div>
        {actions}
      </div>
      <div id={liveId} className="sr" aria-live="polite">
        {liveText}
      </div>
      {isEmpty ? <p className="empty">{empty}</p> : children}
    </article>
  );
}
