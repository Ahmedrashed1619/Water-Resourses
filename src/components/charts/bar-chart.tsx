"use client";

import { useMemo } from "react";
import type { ChartBar } from "@/lib/view";
import { ChartShell } from "./chart-shell";
import { useChartActive } from "./use-chart-active";

type Props = {
  title: string;
  description: string;
  empty: string;
  rows: ChartBar[];
  labelOf: (row: ChartBar) => string;
  primaryLabel: string;
  secondaryLabel: string;
};

export function BarChart({ title, description, empty, rows, labelOf, primaryLabel, secondaryLabel }: Props) {
  const chart = useChartActive("bars");
  const max = useMemo(() => Math.max(...rows.map((row) => Math.max(row.value, row.secondary, 1)), 1), [rows]);
  const active = rows.find((row) => row.id === chart.activeKey) ?? null;
  const liveText = active
    ? `${labelOf(active)}: ${primaryLabel} ${active.value}, ${secondaryLabel} ${active.secondary}`
    : "";

  return (
    <ChartShell
      title={title}
      description={description}
      labelId={chart.labelId}
      descId={chart.descId}
      liveId={chart.liveId}
      liveText={liveText}
      empty={empty}
      isEmpty={!rows.length}
      actions={
        <div className="chart-mini-legend" aria-hidden="true">
          <span><i className="is-primary" />{primaryLabel}</span>
          <span><i className="is-danger" />{secondaryLabel}</span>
        </div>
      }
    >
      <div
        className="chart-bars"
        role="group"
        aria-labelledby={chart.labelId}
        aria-describedby={chart.descId}
      >
        {rows.map((row, index) => {
          const activeRow = chart.activeKey === row.id;
          const dimmed = chart.activeKey !== null && !activeRow;
          const widthPrimary = (row.value / max) * 100;
          const widthSecondary = (row.secondary / max) * 100;
          return (
            <button
              key={row.id}
              type="button"
              className={`chart-bar-row${activeRow ? " is-active" : ""}${dimmed ? " is-dimmed" : ""}`}
              style={{ animationDelay: `${index * 45}ms` }}
              aria-pressed={activeRow}
              aria-label={`${labelOf(row)}: ${primaryLabel} ${row.value}, ${secondaryLabel} ${row.secondary}`}
              onMouseEnter={() => chart.activate(row.id)}
              onMouseLeave={chart.clear}
              onFocus={() => chart.activate(row.id)}
              onBlur={chart.clear}
              onClick={() => chart.togglePin(row.id)}
            >
              <span className="chart-bar-label">{labelOf(row)}</span>
              <span className="chart-bar-track" aria-hidden="true">
                <span className="chart-bar-fill primary" style={{ width: `${widthPrimary}%` }} />
                <span className="chart-bar-fill danger" style={{ width: `${widthSecondary}%` }} />
              </span>
              <span className="chart-bar-nums" aria-hidden="true">
                <b>{row.value}</b>
                <small>{row.secondary > 0 ? `+${row.secondary}` : "—"}</small>
              </span>
              {activeRow ? (
                <span className="chart-tooltip" role="tooltip">
                  <strong>{labelOf(row)}</strong>
                  <span>{primaryLabel}: {row.value}</span>
                  <span>{secondaryLabel}: {row.secondary}</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </ChartShell>
  );
}
