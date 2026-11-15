export const CHART_TONES = {
  primary: "var(--primary)",
  gold: "var(--gold)",
  danger: "var(--danger)",
  warning: "var(--warning)",
  success: "var(--success)",
  muted: "var(--muted)",
} as const;

export type ChartTone = keyof typeof CHART_TONES;

export function chartColor(tone: string): string {
  return CHART_TONES[tone as ChartTone] ?? CHART_TONES.primary;
}

export function percent(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}
