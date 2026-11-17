import Link from "next/link";
import { CreateOperationModal } from "@/components/create-operation-modal";
import { FilterBar } from "@/components/filter-bar";
import { Pager } from "@/components/pager";
import { DerivedStatusChip, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { getLocale } from "@/lib/locale";
import { statusFilterOptionsForRole } from "@/lib/operation-status";
import { getPageSize } from "@/lib/page-size";
import { pageOf } from "@/lib/paging";
import { can, isDepartmentRole } from "@/lib/permissions";
import { filterOptions, listDirectory, listOperations, listTypes } from "@/lib/queries";
import { locName, tx } from "@/lib/text";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; department?: string; status?: string; new?: string; page?: string }>;
}) {
  const user = await requireUser();
  const locale = await getLocale();
  const query = await searchParams;
  const manage = can(user, "operations.manage");
  const canReport = can(user, "operations.report") || can(user, "reports.export") || can(user, "reports.print");
  const [items, options, types, departments] = await Promise.all([
    listOperations(user, { q: query.q, typeId: query.type, departmentId: query.department, status: query.status }),
    filterOptions(),
    manage ? listTypes() : Promise.resolve([]),
    manage ? listDirectory() : Promise.resolve([]),
  ]);
  const statusOptions = statusFilterOptionsForRole(user.role);
  const size = await getPageSize();
  const view = pageOf(items, query.page, size);
  const filtersActive = Boolean(query.q || query.type || query.department || query.status);
  const exportQs = new URLSearchParams();
  if (query.q) exportQs.set("q", query.q);
  if (query.type) exportQs.set("type", query.type);
  if (query.department) exportQs.set("department", query.department);
  if (query.status) exportQs.set("status", query.status);
  const exportQuery = exportQs.toString() ? `?${exportQs}` : "";

  return (
    <>
      <PageHeader
        kicker={tx(locale, "التعاقدات", "Contracts")}
        title={tx(locale, "العمليات", "Operations")}
        lede={tx(
          locale,
          "فلترة بالاسم والنوع والإدارة والحالة. العرض الافتراضي للقطاع: المتأخرة والجارية.",
          "Filter by name, type, department, and status. Sector default: late and in-progress.",
        )}
      >
        <div className="row">
          {canReport ? (
            <>
              {(can(user, "reports.export") || can(user, "operations.report") || can(user, "reports.overrun.download")) ? (
                <a className="btn btn-ghost" href={`/api/reports/operations-excel${exportQuery}`}>
                  {tx(locale, "تصدير Excel", "Export Excel")}
                </a>
              ) : null}
              {can(user, "reports.print") || can(user, "operations.report") ? (
                <Link className="btn btn-ghost" href={`/print/operations${exportQuery}`} target="_blank">
                  {tx(locale, "طباعة", "Print")}
                </Link>
              ) : null}
            </>
          ) : null}
          {manage ? (
            <CreateOperationModal
              startOpen={query.new === "1"}
              types={types
                .filter((type) => type.isActive && !type.deletedAt)
                .map((type) => ({
                  id: type.id,
                  code: type.code,
                  nameAr: type.nameAr,
                  nameEn: type.nameEn,
                  stages: type.stages
                    .filter((stage) => stage.isActive && !stage.departmentId && !stage.deletedAt)
                    .map((stage) => ({
                      code: stage.code,
                      nameAr: stage.nameAr,
                      nameEn: stage.nameEn,
                      sortOrder: stage.sortOrder,
                      durationMonths: stage.durationMonths,
                      durationDays: stage.durationDays,
                      anchor: stage.anchor,
                    })),
                }))}
              departments={departments.map((department) => ({
                id: department.id,
                code: department.code,
                nameAr: department.nameAr,
                nameEn: department.nameEn,
              }))}
            />
          ) : null}
        </div>
      </PageHeader>

      <FilterBar
        action="/operations"
        values={{ q: query.q, type: query.type, department: query.department, status: query.status }}
        fields={[
          { kind: "text", name: "q", label: tx(locale, "بحث", "Search"), placeholder: tx(locale, "اسم العملية", "Operation name") },
          {
            kind: "select",
            name: "type",
            label: tx(locale, "النوع", "Type"),
            options: [
              { value: "", label: tx(locale, "الكل", "All") },
              ...options.types.map((type) => ({ value: type.id, label: locName(locale, type.nameAr, type.nameEn) })),
            ],
          },
          ...(!isDepartmentRole(user.role)
            ? [
                {
                  kind: "select" as const,
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
              ]
            : []),
          {
            kind: "select",
            name: "status",
            label: tx(locale, "الحالة", "Status"),
            options: [
              { value: "", label: tx(locale, "الافتراضي", "Default") },
              ...statusOptions.map((item) => ({
                value: item.value,
                label: locale === "ar" ? item.ar : item.en,
              })),
            ],
          },
        ]}
      />

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="col-name">{tx(locale, "العملية", "Operation")}</th>
              <th className="col-type">{tx(locale, "النوع", "Type")}</th>
              <th className="col-date">{tx(locale, "الموافقة", "Approval")}</th>
              <th className="col-dept">{tx(locale, "الإدارات", "Departments")}</th>
              <th className="col-money">{tx(locale, "الاعتماد الحالي", "Current amount")}</th>
              <th className="col-status">{tx(locale, "الحالة", "Status")}</th>
            </tr>
          </thead>
          <tbody>
            {view.total === 0 ? (
              <tr>
                <td colSpan={6} className="empty">
                  {tx(locale, "لا عمليات مطابقة.", "No matching operations.")}
                </td>
              </tr>
            ) : (
              view.rows.map((item) => (
                <tr key={item.id}>
                  <td className="col-name">
                    <Link className="link" href={`/operations/${item.id}`}>
                      {locName(locale, item.nameAr, item.nameEn)}
                    </Link>
                  </td>
                  <td className="col-type">{locName(locale, item.typeAr, item.typeEn)}</td>
                  <td className="num col-date">{formatDate(item.approvalDate)}</td>
                  <td className="col-dept">
                    {item.departmentCount}
                    <div className="fine">{locName(locale, item.departmentsAr, item.departmentsEn)}</div>
                  </td>
                  <td className="num col-money">{formatMoney(item.amount, locale)}</td>
                  <td className="col-status">
                    <DerivedStatusChip locale={locale} status={item.derivedStatus} daysLate={item.daysLate} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pager
        locale={locale}
        page={view.page}
        pages={view.pages}
        total={view.total}
        from={view.from}
        to={view.to}
        size={view.size}
        base="/operations"
        params={{ q: query.q, type: query.type, department: query.department, status: query.status }}
      />
    </>
  );
}
