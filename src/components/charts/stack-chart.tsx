"use client";

import { useMemo } from "react";
import type { ChartSlice } from "@/lib/view";
import { ChartLegend } from "./chart-legend";
import { ChartShell } from "./chart-shell";
import { chartColor, percent } from "./tones";
import { useChartActive } from "./use-chart-active";

type Props = {
  title: string;
  description: string;
  empty: string;
  slices: ChartSlice[];
  labelOf: (slice: ChartSlice) => string;
  hintIdle: string;
};

export function StackChart({ title, description, empty, slices, labelOf, hintIdle }: Props) {
  const chart = useChartActive("stack");
  const total = useMemo(() => slices.reduce((sum, item) => sum + item.value, 0), [slices]);
  const active = slices.find((item) => item.key === chart.activeKey) ?? null;
  const liveText = active
    ? `${labelOf(active)}: ${active.value} (${percent(active.value, total)}%)`
    : `${title}: ${total}`;

  return (
    <ChartShell
      title={title}
      description={description}
      labelId={chart.labelId}
      descId={chart.descId}
      liveId={chart.liveId}
      liveText={liveText}
      empty={empty}
      isEmpty={!slices.length}
    >
      <div className="chart-stack-wrap">
        <div
          className="chart-stack"
          role="group"
          aria-labelledby={chart.labelId}
          aria-describedby={chart.descId}
        >
          {slices.map((slice) => {
            const activeSeg = chart.activeKey === slice.key;
            const dimmed = chart.activeKey !== null && !activeSeg;
            const share = percent(slice.value, total);
            return (
              <button
                key={slice.key}
                type="button"
                className={`chart-stack-seg${activeSeg ? " is-active" : ""}${dimmed ? " is-dimmed" : ""}`}
                style={{
                  flexGrow: Math.max(slice.value, 0.01),
                  flexBasis: 0,
                  background: chartColor(slice.tone),
                }}
                aria-pressed={activeSeg}
                aria-label={`${labelOf(slice)}: ${slice.value} (${share}%)`}
                onMouseEnter={() => chart.activate(slice.key)}
                onMouseLeave={chart.clear}
                onFocus={() => chart.activate(slice.key)}
                onBlur={chart.clear}
                onClick={() => chart.togglePin(slice.key)}
              >
                {share >= 12 ? <span>{share}%</span> : null}
              </button>
            );
          })}
        </div>
        <div className={`chart-stack-hint${active ? "" : " is-idle"}`} role="status">
          {active ? (
            <>
              <span className="chart-swatch" style={{ background: chartColor(active.tone) }} aria-hidden="true" />
              <strong>{labelOf(active)}</strong>
              <span>{active.value} · {percent(active.value, total)}%</span>
            </>
          ) : (
            <span className="muted">{hintIdle}</span>
          )}
        </div>
        <ChartLegend
          labelledBy={chart.labelId}
          items={slices.map((slice) => ({
            key: slice.key,
            label: labelOf(slice),
            value: slice.value,
            tone: slice.tone,
          }))}
          total={total}
          activeKey={chart.activeKey}
          onActivate={chart.activate}
          onClear={chart.clear}
          onSelect={chart.togglePin}
        />
      </div>
    </ChartShell>
  );
}
