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
  trailing,
}: {
  href: string;
  title: string;
  meta: string;
  trailing: ReactNode;
}) {
  return (
    <li>
      <Link className="dash-list-link" href={href}>
        <span>
          <b>{title}</b>
          <small>{meta}</small>
        </span>
        {trailing}
      </Link>
    </li>
  );
}
