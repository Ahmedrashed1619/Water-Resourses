"use client";

import { chartColor, percent } from "./tones";

export type LegendItem = {
  key: string;
  label: string;
  value: number;
  tone: string;
  hint?: string;
};

export function ChartLegend({
  items,
  total,
  activeKey,
  onActivate,
  onClear,
  onSelect,
  labelledBy,
}: {
  items: LegendItem[];
  total: number;
  activeKey: string | null;
  onActivate: (key: string) => void;
  onClear: () => void;
  onSelect: (key: string) => void;
  labelledBy: string;
}) {
  return (
    <ul className="chart-legend" role="list" aria-labelledby={labelledBy}>
      {items.map((item) => {
        const active = activeKey === item.key;
        const share = percent(item.value, total);
        return (
          <li key={item.key}>
            <button
              type="button"
              className={`chart-legend-btn${active ? " is-active" : ""}`}
              aria-pressed={active}
              aria-label={`${item.label}: ${item.value} (${share}%)${item.hint ? `. ${item.hint}` : ""}`}
              onMouseEnter={() => onActivate(item.key)}
              onMouseLeave={onClear}
              onFocus={() => onActivate(item.key)}
              onBlur={onClear}
              onClick={() => onSelect(item.key)}
            >
              <span className="chart-swatch" style={{ background: chartColor(item.tone) }} aria-hidden="true" />
              <span className="chart-legend-label">{item.label}</span>
              <span className="chart-legend-meta">
                <b>{item.value}</b>
                <small>{share}%</small>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
