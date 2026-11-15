"use client";

import { useMemo } from "react";
import type { ChartSlice } from "@/lib/view";
import { ChartLegend } from "./chart-legend";
import { ChartShell } from "./chart-shell";
import { buildDonutSegments, donutArc } from "./geometry";
import { chartColor, percent } from "./tones";
import { useChartActive } from "./use-chart-active";

type Props = {
  title: string;
  description: string;
  empty: string;
  slices: ChartSlice[];
  labelOf: (slice: ChartSlice) => string;
  centerCaption: string;
};

export function DonutChart({ title, description, empty, slices, labelOf, centerCaption }: Props) {
  const chart = useChartActive("donut");
  const total = useMemo(() => slices.reduce((sum, item) => sum + item.value, 0), [slices]);
  const segments = useMemo(() => buildDonutSegments(slices), [slices]);
  const active = slices.find((item) => item.key === chart.activeKey) ?? null;
  const centerValue = active ? active.value : total;
  const centerLabel = active ? labelOf(active) : centerCaption;
  const liveText = active
    ? `${labelOf(active)}: ${active.value} (${percent(active.value, total)}%)`
    : `${centerCaption}: ${total}`;

  return (
    <ChartShell
      title={title}
      description={description}
      labelId={chart.labelId}
      descId={chart.descId}
      liveId={chart.liveId}
      liveText={liveText}
      empty={empty}
      isEmpty={!total}
    >
      <div className="chart-donut-wrap">
        <div className="chart-donut-stage">
          <svg
            className="chart-donut-svg"
            viewBox="0 0 120 120"
            role="img"
            aria-labelledby={chart.labelId}
            aria-describedby={`${chart.descId} ${chart.liveId}`}
          >
            <defs>
              <filter id={`${chart.baseId}-glow`} x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.4" floodColor="rgba(11,106,154,0.35)" />
              </filter>
            </defs>
            <circle cx="60" cy="60" r="42" className="chart-donut-track" />
            {segments.map((segment) => {
              const slice = slices.find((item) => item.key === segment.key);
              if (!slice) return null;
              const isActive = chart.activeKey === slice.key;
              const dimmed = chart.activeKey !== null && !isActive;
              return (
                <path
                  key={slice.key}
                  className={`chart-donut-arc${isActive ? " is-active" : ""}${dimmed ? " is-dimmed" : ""}`}
                  d={donutArc(60, 60, 46, segment.start, segment.end, isActive ? 16 : 13)}
                  fill={chartColor(slice.tone)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isActive}
                  aria-label={`${labelOf(slice)}: ${slice.value} (${percent(slice.value, total)}%)`}
                  filter={isActive ? `url(#${chart.baseId}-glow)` : undefined}
                  onMouseEnter={() => chart.activate(slice.key)}
                  onMouseLeave={chart.clear}
                  onFocus={() => chart.activate(slice.key)}
                  onBlur={chart.clear}
                  onClick={() => chart.togglePin(slice.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      chart.togglePin(slice.key);
                    }
                  }}
                />
              );
            })}
            <circle cx="60" cy="60" r="28" className="chart-donut-hole" />
          </svg>
          <div className="chart-donut-center" aria-hidden="true">
            <strong>{centerValue}</strong>
            <span>{centerLabel}</span>
            {active ? <em>{percent(active.value, total)}%</em> : null}
          </div>
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
