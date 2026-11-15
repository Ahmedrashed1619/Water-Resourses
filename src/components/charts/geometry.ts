/** Build an SVG donut arc path. Angles in degrees, 0 = top, clockwise. */
export function donutArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, thickness: number): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const outerStart = { x: cx + radius * Math.cos(toRad(startAngle)), y: cy + radius * Math.sin(toRad(startAngle)) };
  const outerEnd = { x: cx + radius * Math.cos(toRad(endAngle)), y: cy + radius * Math.sin(toRad(endAngle)) };
  const innerRadius = radius - thickness;
  const innerStart = { x: cx + innerRadius * Math.cos(toRad(endAngle)), y: cy + innerRadius * Math.sin(toRad(endAngle)) };
  const innerEnd = { x: cx + innerRadius * Math.cos(toRad(startAngle)), y: cy + innerRadius * Math.sin(toRad(startAngle)) };
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${radius} ${radius} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${large} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

export type DonutSegment = {
  key: string;
  start: number;
  end: number;
  mid: number;
};

export function buildDonutSegments(values: { key: string; value: number }[]): DonutSegment[] {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  if (!total) return [];
  let angle = 0;
  return values.map((item) => {
    const sweep = (item.value / total) * 360;
    const start = angle;
    const end = angle + Math.max(sweep, item.value > 0 ? 0.8 : 0);
    const mid = start + (end - start) / 2;
    angle = end;
    return { key: item.key, start, end: Math.min(end, 359.999), mid };
  });
}
