"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { can, type Permission } from "@/lib/permissions";
import { roleLabel } from "@/lib/labels";
import { logoutAction } from "@/server/actions";
import { Tip } from "./tip";
import { LocaleToggle, ThemeToggle } from "./toggles";

type Item = {
  href: string;
  key: "dashboard" | "operations" | "departments" | "finance" | "alerts" | "reports" | "revisions" | "users" | "settings" | "audit" | "needs";
  icon: string;
  permission?: Permission;
  anyOf?: Permission[];
  badge?: "alerts" | "revisions" | "needs";
};

const ITEMS: Item[] = [
  { href: "/", key: "dashboard", icon: "M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z" },
  { href: "/operations", key: "operations", icon: "M4 7h16M4 12h16M4 17h10" },
  { href: "/departments", key: "departments", icon: "M4 18V8l8-4 8 4v10M9 18v-5h6v5", permission: "departments.view" },
  { href: "/finance", key: "finance", icon: "M5 8h14v9H5zM8 8V6h8v2M8 12h4", permission: "finance.manage" },
  { href: "/alerts", key: "alerts", icon: "M12 4a5 5 0 0 1 5 5v3l1.5 2.5h-13L7 12V9a5 5 0 0 1 5-5zM10 18a2 2 0 0 0 4 0", badge: "alerts" },
  { href: "/reports", key: "reports", icon: "M7 3h7l5 5v13H7zM14 3v5h5", anyOf: ["reports.export", "reports.print", "reports.overrun"] },
  { href: "/revisions", key: "revisions", icon: "M5 12a7 7 0 1 0 2-4.9M5 4v4h4", permission: "revisions.view", badge: "revisions" },
  { href: "/needs", key: "needs", icon: "M12 3v18M5 10h14M7 16h10", anyOf: ["needs.view", "needs.create", "needs.respond"], badge: "needs" },
  { href: "/users", key: "users", icon: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 19a5 5 0 0 1 10 0M17 11a2.5 2.5 0 1 0 0-5M16 19a4.5 4.5 0 0 1 4-4", permission: "users.manage" },
  { href: "/settings", key: "settings", icon: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 12h3M17 12h3M12 4v3M12 17v3" },
  { href: "/audit", key: "audit", icon: "M6 5h12v14H6zM9 9h6M9 13h6", permission: "audit.view" },
];

export function Shell({
  role,
  tasks = null,
  name,
  email,
  department,
  counts,
  today,
  children,
}: {
  role: string;
  tasks?: string | null;
  name: string;
  email: string;
  department: string | null;
  counts: { alerts: number; revisions: number; needs: number };
  today: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { d, locale, t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [wide, setWide] = useState(true);
  const actor = { role, tasks };
  const items = ITEMS.filter((item) => {
    if (item.anyOf?.length) return item.anyOf.some((key) => can(actor, key));
    if (item.permission) return can(actor, item.permission);
    return true;
  });
  const iconOnly = wide && collapsed;

  useEffect(() => {
    setCollapsed(localStorage.getItem("operio-sidebar") === "collapsed");
    const media = window.matchMedia("(min-width: 961px)");
    const apply = () => setWide(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawer]);

  function toggleNav() {
    if (window.matchMedia("(max-width: 960px)").matches) {
      setDrawer((value) => !value);
      return;
    }
    setCollapsed((value) => {
      localStorage.setItem("operio-sidebar", value ? "open" : "collapsed");
      return !value;
    });
  }

  return (
    <div className={`app-shell${collapsed ? " is-collapsed" : ""}${drawer ? " is-drawer" : ""}`}>
      <button className="backdrop" type="button" aria-label={t("إغلاق القائمة", "Close menu")} aria-hidden={drawer ? undefined : true} tabIndex={-1} onClick={() => setDrawer(false)} />
      <aside className="sidebar" aria-hidden={wide ? undefined : drawer ? undefined : true}>
        <Tip text={t("إغلاق القائمة", "Close menu")} className="nav-tip">
        <button className="icon-btn sidebar-close" type="button" onClick={() => setDrawer(false)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        </Tip>
        <div className="brand-lockup">
          <img src="/brand/sector.jpg" alt={locale === "ar" ? "شعار قطاع الري" : "Irrigation Sector logo"} />
          <div className="brand-copy">
            <strong>{d.appName}</strong>
            <span>{d.sector}</span>
          </div>
        </div>
        <nav className="nav-group">
          <div className="nav-label">{locale === "ar" ? "المتابعة" : "Follow-up"}</div>
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : item.href === "/settings" ? pathname === "/settings" : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const badge = item.badge ? counts[item.badge] : 0;
            const label = d.nav[item.key];
            const link = (
              <Link href={item.href} className={active ? "nav-link active" : "nav-link"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d={item.icon} />
                </svg>
                <span className="nav-text">{label}</span>
                {badge > 0 ? <span className="nav-badge">{badge}</span> : null}
              </Link>
            );
            return iconOnly ? <Tip key={item.href} text={label} className="nav-tip">{link}</Tip> : <span key={item.href} className="nav-slot">{link}</span>;
          })}
        </nav>
        <div className="sidebar-foot">
          {iconOnly ? (
            <Tip text={`${name} · ${roleLabel(locale, role)}`} className="nav-tip">
              <div className="who">
                <span className="avatar">{name.slice(0, 1)}</span>
                <div className="who-copy">
                  <b>{name}</b>
                  <small>{roleLabel(locale, role)}{department ? ` · ${department}` : ""}</small>
                </div>
              </div>
            </Tip>
          ) : (
            <div className="who">
              <span className="avatar">{name.slice(0, 1)}</span>
              <div className="who-copy">
                <b>{name}</b>
                <small>{roleLabel(locale, role)}{department ? ` · ${department}` : ""}</small>
              </div>
            </div>
          )}
          <div className="ministry-line">
            <img className="round-seal" src="/brand/ministry.jpg" alt="" />
            <span className="ministry-copy">{d.ministry}</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="row">
            <Tip text={wide ? (collapsed ? t("توسيع القائمة", "Expand the menu") : t("طي القائمة", "Collapse the menu")) : (drawer ? t("إغلاق القائمة", "Close menu") : t("فتح القائمة", "Open menu"))}>
              <button className="icon-btn menu-btn" type="button" onClick={toggleNav}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            </Tip>
            <p className="top-title">{today}</p>
            <span className="chip gold">{roleLabel(locale, role)}</span>
          </div>
          <div className="row">
            <LocaleToggle />
            <ThemeToggle />
            <form action={logoutAction}>
              <button className="btn btn-ghost btn-sm" type="submit">{d.common.logout}</button>
            </form>
          </div>
        </header>
        <div className="page">{children}</div>
        <p className="fine page-mail">{email}</p>
      </div>
    </div>
  );
}
