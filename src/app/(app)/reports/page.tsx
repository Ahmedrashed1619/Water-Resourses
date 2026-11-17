import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportStudio } from "@/components/report-studio";
import { SelectBox } from "@/components/select-box";
import { PageHeader, StatusChip } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import { can } from "@/lib/permissions";
import { filterOptions, listAlerts, listOperationExportRows } from "@/lib/queries";
import { locName, tx } from "@/lib/text";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string; stage?: string; department?: string; type?: string; status?: string; q?: string }>;
}) {
  const user = await requireUser();
  const canExport = can(user, "reports.export");
  const canPrint = can(user, "reports.print");
  const canOverrun = can(user, "reports.overrun") || can(user, "reports.overrun.download");
  if (!canExport && !canPrint && !canOverrun) redirect("/");
  const locale = await getLocale();
  const query = await searchParams;
  const [alertRows, options, opRows] = await Promise.all([
    canExport ? listAlerts(user, { departmentId: query.departmentId, stageCode: query.stage }) : Promise.resolve([]),
    filterOptions(),
    canExport || canPrint
      ? listOperationExportRows(user, {
          q: query.q,
          typeId: query.type,
          departmentId: query.department,
          status: query.status,
        })
      : Promise.resolve([]),
  ]);
  const alertSearch = `?departmentId=${query.departmentId ?? ""}&stage=${query.stage ?? ""}`;
  const opQs = new URLSearchParams();
  if (query.q) opQs.set("q", query.q);
  if (query.type) opQs.set("type", query.type);
  if (query.department) opQs.set("department", query.department);
  if (query.status) opQs.set("status", query.status);
  const opQuery = opQs.toString() ? `?${opQs}` : "";
  const overdueQs = new URLSearchParams(opQs);
  overdueQs.set("overdue", "1");
  const overdueQuery = `?${overdueQs}`;

  return (
    <>
      <PageHeader
        kicker={tx(locale, "تصدير وطباعة", "Export & print")}
        title={tx(locale, "التقارير", "Reports")}
        lede={tx(
          locale,
          "قسمان فقط: تقرير العمليات (جدول العمليات)، وتقرير التنبيهات (جدول التأخير).",
          "Only two reports: operations (the operations table), and alerts (the delay table).",
        )}
      />

      {(canExport || canPrint) && (
        <section className="card card-pad stack">
          <div>
            <h2>{tx(locale, "1) تقرير العمليات", "1) Operations report")}</h2>
            <p className="note">
              {tx(
                locale,
                "يصدّر قائمة العمليات نفسها اللي في شاشة العمليات — مع الفلاتر. استخدم «المتأخر فقط» لو عايز تجاوز المدة.",
                "Exports the same operations list as the Operations screen — with filters. Use “Overdue only” for overrun.",
              )}
            </p>
          </div>
          <form className="filters" action="/reports">
            <label className="field">
              <span>{tx(locale, "بحث", "Search")}</span>
              <input className="input" name="q" defaultValue={query.q ?? ""} />
            </label>
            <label className="field">
              <span>{tx(locale, "النوع", "Type")}</span>
              <SelectBox
                name="type"
                defaultValue={query.type ?? ""}
                options={[
                  { value: "", label: tx(locale, "الكل", "All") },
                  ...options.types.map((type) => ({
                    value: type.id,
                    label: locName(locale, type.nameAr, type.nameEn),
                  })),
                ]}
              />
            </label>
            <label className="field">
              <span>{tx(locale, "الإدارة", "Department")}</span>
              <SelectBox
                name="department"
                defaultValue={query.department ?? ""}
                options={[
                  { value: "", label: tx(locale, "الكل", "All") },
                  ...options.departments.map((department) => ({
                    value: department.id,
                    label: locName(locale, department.nameAr, department.nameEn),
                  })),
                ]}
              />
            </label>
            <label className="field">
              <span>{tx(locale, "الحالة", "Status")}</span>
              <SelectBox
                name="status"
                defaultValue={query.status ?? ""}
                options={[
                  { value: "", label: tx(locale, "الكل", "All") },
                  { value: "overdue", label: tx(locale, "متأخر", "Overdue") },
                  { value: "on_track", label: tx(locale, "في التنفيذ", "In execution") },
                  { value: "completed", label: tx(locale, "مكتمل", "Completed") },
                ]}
              />
            </label>
            <button className="btn btn-primary" type="submit">
              {tx(locale, "تصفية", "Filter")}
            </button>
          </form>
          <div className="row report-actions">
            {canExport || canOverrun ? (
              <a className="btn btn-primary" href={`/api/reports/operations-excel${opQuery}`}>
                {tx(locale, "Excel العمليات", "Operations Excel")}
              </a>
            ) : null}
            {canPrint ? (
              <Link className="btn btn-ghost" href={`/print/operations${opQuery}`} target="_blank">
                {tx(locale, "طباعة العمليات", "Print operations")}
              </Link>
            ) : null}
            {canOverrun ? (
              <a className="btn btn-gold" href={`/api/reports/operations-excel${overdueQuery}`}>
                {tx(locale, "Excel المتأخر فقط", "Overdue Excel only")}
              </a>
            ) : null}
            <span className="fine">{tx(locale, `${opRows.length} صف`, `${opRows.length} rows`)}</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{tx(locale, "العملية", "Operation")}</th>
                  <th>{tx(locale, "النوع", "Type")}</th>
                  <th>{tx(locale, "الإدارة", "Department")}</th>
                  <th>{tx(locale, "الاعتماد", "Approval")}</th>
                  <th>{tx(locale, "الحالة", "Status")}</th>
                  <th>{tx(locale, "المعتمد", "Approved")}</th>
                  <th>{tx(locale, "الحالي", "Current")}</th>
                </tr>
              </thead>
              <tbody>
                {opRows.length === 0 ? (
                  <tr>
                    <td className="empty" colSpan={7}>
                      {tx(locale, "لا توجد صفوف مطابقة للفلاتر.", "No rows match the filters.")}
                    </td>
                  </tr>
                ) : (
                  opRows.map((row, index) => (
                    <tr key={`${row.operationId}-${row.departmentAr}-${index}`}>
                      <td>{locName(locale, row.operationAr, row.operationEn)}</td>
                      <td>{locName(locale, row.typeAr, row.typeEn)}</td>
                      <td>{locName(locale, row.departmentAr, row.departmentEn)}</td>
                      <td>{formatDate(row.approvalDate)}</td>
                      <td>
                        <StatusChip locale={locale} status={row.status} />
                      </td>
                      <td>{row.approvedAmount}</td>
                      <td>{row.currentAmount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {canExport ? (
        <section className="card card-pad stack">
          <div>
            <h2>{tx(locale, "2) تقرير التنبيهات", "2) Alerts report")}</h2>
            <p className="note">
              {tx(
                locale,
                "ده جدول مختلف: تنبيهات التأخير (مش قائمة العمليات). تنزّله Excel أو Word أو صورة من المعاينة.",
                "A different table: delay alerts (not the operations list). Download Excel, Word, or an image of the preview.",
              )}
            </p>
          </div>
          <ReportStudio rows={alertRows} query={alertSearch} />
        </section>
      ) : canOverrun ? (
        <section className="card card-pad stack">
          <div>
            <h2>{tx(locale, "تصدير المتأخر", "Overdue export")}</h2>
            <p className="note">{tx(locale, "عمليات متأخرة فقط.", "Overdue operations only.")}</p>
          </div>
          <div className="row report-actions">
            <a className="btn btn-primary" href="/api/reports/operations-excel?overdue=1">
              {tx(locale, "Excel المتأخر", "Overdue Excel")}
            </a>
            {canPrint ? (
              <Link className="btn btn-ghost" href="/print/operations?overdue=1" target="_blank">
                {tx(locale, "طباعة المتأخر", "Print overdue")}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
