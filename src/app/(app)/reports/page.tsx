import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportStudio } from "@/components/report-studio";
import { SelectBox } from "@/components/select-box";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
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
    canExport || canOverrun ? listAlerts(user, { departmentId: query.departmentId, stageCode: query.stage }) : Promise.resolve([]),
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

  return (
    <>
      <PageHeader
        kicker={tx(locale, "تصدير وطباعة", "Export & print")}
        title={tx(locale, "التقارير", "Reports")}
        lede={tx(
          locale,
          "تصدير Excel وطباعة للعمليات المصفاة، وتقرير التجاوز للقطاع.",
          "Excel export and print for filtered operations, plus the Sector overrun report.",
        )}
      />

      {(canExport || canPrint) && (
        <section className="card card-pad stack">
          <h2>{tx(locale, "تقرير العمليات", "Operations report")}</h2>
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
          <div className="row">
            {canExport || canOverrun ? (
              <a className="btn btn-primary" href={`/api/reports/operations-excel${opQuery}`}>
                {tx(locale, "تصدير Excel", "Export Excel")}
              </a>
            ) : null}
            {canPrint ? (
              <Link className="btn btn-ghost" href={`/print/operations${opQuery}`} target="_blank">
                {tx(locale, "طباعة", "Print")}
              </Link>
            ) : null}
            <span className="fine">
              {tx(locale, `${opRows.length} صف`, `${opRows.length} rows`)}
            </span>
          </div>
        </section>
      )}

      {canOverrun ? (
        <section className="card card-pad stack">
          <h2>{tx(locale, "تقرير التجاوز", "Overrun report")}</h2>
          <p className="note">
            {tx(locale, "عمليات متأخرة فقط — Excel وطباعة.", "Overdue operations only — Excel and print.")}
          </p>
          <div className="row">
            <a className="btn btn-primary" href="/api/reports/operations-excel?overdue=1">
              {tx(locale, "Excel التجاوز", "Overrun Excel")}
            </a>
            <Link className="btn btn-ghost" href="/print/operations?overdue=1" target="_blank">
              {tx(locale, "طباعة التجاوز", "Print overrun")}
            </Link>
            {(canExport || canOverrun) && (
              <>
                <a className="btn" href={`/api/reports/excel${alertSearch}`}>
                  {tx(locale, "تنبيهات Excel", "Alerts Excel")}
                </a>
                <a className="btn" href={`/api/reports/word${alertSearch}`}>
                  {tx(locale, "تنبيهات Word", "Alerts Word")}
                </a>
              </>
            )}
          </div>
          {canExport ? <ReportStudio rows={alertRows} query={alertSearch} /> : null}
        </section>
      ) : null}
    </>
  );
}
