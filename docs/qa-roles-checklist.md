# Operio — 6-role QA checklist

Manual pass after `pnpm lint` / `pnpm test` / `pnpm build`.

| Role | Sidebar | Dashboard | Forbidden | Isolation |
|------|---------|-----------|-----------|-----------|
| SECTOR_SUPER_ADMIN | Needs badge, Reports (export/print/overrun), Users, Audit, Settings types | Overdue panel + recent feed; no «عملية جديدة» CTA | — | Ops detail `?department=` hides other depts |
| SECTOR_ADMIN | Same minus Audit; no alerts.manage delete unless granted | Same | `/audit` → redirect | Users: cannot see SSA |
| SECTOR_EMPLOYEE | View/print/needs/revisions/depts/alerts only | Overdue-focused | Users/settings manage, finance, create ops | Needs respond hidden |
| DEPARTMENT_SUPER_ADMIN | Needs create, own dept only, users | Dept alerts (halfway/due soon) | Sector reports.overrun, other depts URLs | `/departments` → own id |
| DEPARTMENT_ADMIN | Needs create; employee tasks view+print | Same | Create SE-level sector users | Soft warnings on date revise |
| DEPARTMENT_EMPLOYEE | Alerts + needs view + print | Scoped ops | Create needs if no needs.create | Cannot see DSA on users |

Also verify: soft-deleted types in recycle bin; funding tranche «دفعة اعتماد»; needs SUBMITTED→UNDER_REVIEW→decision without auto-op create; Excel ملخص+التفاصيل; print A4 landscape.
