import Link from "next/link";
import type { ReactNode } from "react";

export function DashList({ children, labelledBy }: { children: ReactNode; labelledBy?: string }) {
  return (
    <ul className="dash-list" aria-labelledby={labelledBy}>
      {children}
    </ul>
  );
}

export function DashListItem({
  href,
  title,
  meta,
  tone,
  trailing,
}: {
  href: string;
  title: string;
  meta: string;
  /** Left accent bar — no duplicate label chip. */
  tone?: "overdue" | "revision" | "new";
  /** Optional compact meta on the side (e.g. +days). Avoid long chips. */
  trailing?: ReactNode;
}) {
  return (
    <li>
      <Link className={`dash-list-link${tone ? ` is-${tone}` : ""}${trailing ? " has-trailing" : ""}`} href={href}>
        <span className="dash-list-copy">
          <b>{title}</b>
          <small>{meta}</small>
        </span>
        {trailing ? <span className="dash-list-trailing">{trailing}</span> : null}
      </Link>
    </li>
  );
}
