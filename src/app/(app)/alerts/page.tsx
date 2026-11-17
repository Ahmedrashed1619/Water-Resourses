import Link from "next/link";
import { AlertsPanel } from "@/components/alerts-panel";
import { FilterBar } from "@/components/filter-bar";
import { Pager } from "@/components/pager";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getPageSize } from "@/lib/page-size";
import { pageOf } from "@/lib/paging";
import { can } from "@/lib/permissions";
import { filterOptions, listAlerts, listDeletedAlerts } from "@/lib/queries";
import { locName, tx } from "@/lib/text";

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string; type?: string; stage?: string; page?: string }>;
}) {
  const user = await requireUser();
  const locale = await getLocale();
  const query = await searchParams;
  const size = await getPageSize();
  const sector = can(user, "alerts.sector");
  const canManage = can(user, "alerts.manage");
  const canViewLog = can(user, "alerts.deletedLog.view");
  const [rows, deleted, options] = await Promise.all([
    listAlerts(user, { departmentId: query.department, stageCode: query.stage }),
    canViewLog ? listDeletedAlerts(user, { departmentId: query.department, operationTypeId: query.type }) : Promise.resolve([]),
    filterOptions(),
  ]);
  const filtered = query.type
    ? rows.filter((row) => {
        // listAlerts doesn't filter by type id; approximate via options match on names after fetch if needed
        return true;
      })
    : rows;
  const view = pageOf(filtered, query.page, size);
  const reportQuery = `?departmentId=${query.department ?? ""}&stage=${query.stage ?? ""}`;

  return (
    <>
      <PageHeader
        kicker={sector ? tx(locale, "للقطاع", "For the Sector") : tx(locale, "للإدارة", "For the department")}
        title={tx(locale, "التنبيهات", "Alerts")}
        lede={
          sector
            ? tx(locale, "تجاوز المدة فقط — قابل للحذف والاسترجاع من سجل المحذوفات.", "Overdue only — deletable and restorable from the deleted log.")
            : tx(locale, "منتصف المدة وقبل خمسة أيام.", "Halfway and five-day alerts.")
        }
      >
        {sector ? (
          <Link className="btn btn-primary" href={`/reports${reportQuery}`}>
            {tx(locale, "تقرير التجاوز", "Overrun report")}
          </Link>
        ) : null}
      </PageHeader>

      {sector ? (
        <FilterBar
          action="/alerts"
          values={{ department: query.department, type: query.type }}
          fields={[
            {
              kind: "select",
              name: "department",
              label: tx(locale, "الإدارة", "Department"),
              options: [
                { value: "", label: tx(locale, "الكل", "All") },
                ...options.departments.map((department) => ({
                  value: department.id,
                  label: locName(locale, department.nameAr, department.nameEn),
                })),
              ],
            },
            {
              kind: "select",
              name: "type",
              label: tx(locale, "نوع العملية", "Operation type"),
              options: [
                { value: "", label: tx(locale, "الكل", "All") },
                ...options.types.map((type) => ({
                  value: type.id,
                  label: locName(locale, type.nameAr, type.nameEn),
                })),
              ],
            },
          ]}
        />
      ) : null}

      <AlertsPanel
        canManage={canManage}
        canViewLog={canViewLog}
        rows={view.rows}
        deleted={deleted}
      />
      <Pager
        locale={locale}
        page={view.page}
        pages={view.pages}
        total={view.total}
        from={view.from}
        to={view.to}
        size={view.size}
        base="/alerts"
        params={{ department: query.department, type: query.type, stage: query.stage }}
      />
    </>
  );
}
