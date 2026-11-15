import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "danger" | "gold";
}) {
  return (
    <article className={`card stat${tone !== "default" ? ` ${tone}` : ""}`}>
      <div className="label">{label}</div>
      <div className={`value${typeof value === "string" && value.length > 8 ? " money-value" : ""}`}>{value}</div>
    </article>
  );
}
