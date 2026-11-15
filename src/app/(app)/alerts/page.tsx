import Link from "next/link";
import { Pager } from "@/components/pager";
import { SelectBox } from "@/components/select-box";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { daysPhrase, formatDate } from "@/lib/format";
import { alertLabel } from "@/lib/labels";
import { getLocale } from "@/lib/locale";
import { getPageSize } from "@/lib/page-size";
import { pageOf } from "@/lib/paging";
import { can } from "@/lib/permissions";
import { filterOptions, listAlerts } from "@/lib/queries";
import { deleteAlertAction } from "@/server/actions";
import { locName, tx } from "@/lib/text";

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ department?: string; stage?: string; page?: string }> }) {
  const user = await requireUser();
  const locale = await getLocale();
  const query = await searchParams;
  const size = await getPageSize();
  const sector = can(user, "alerts.sector");
  const [rows, options] = await Promise.all([
    listAlerts(user, { departmentId: query.department, stageCode: query.stage }),
    filterOptions(),
  ]);
  const view = pageOf(rows, query.page, size);
  const reportQuery = `?departmentId=${query.department ?? ""}&stage=${query.stage ?? ""}`;
  return (
    <>
      <PageHeader
        kicker={sector ? tx(locale, "للقطاع", "For the Sector") : tx(locale, "للإدارة", "For the department")}
        title={tx(locale, "التنبيهات", "Alerts")}
        lede={sector
          ? tx(locale, "يظهر هنا تجاوز المدة فقط: اسم العملية والإدارة والمرحلة وعدد أيام التأخير. تنبيها المنتصف وقبل خمسة أيام لا يصلان للقطاع.", "Only overdue alerts appear here: operation, department, stage, and days late. Halfway and five-day alerts stay with the department.")
          : tx(locale, "يصل إليك تنبيه عند منتصف المدة، وآخر عندما يتبقى خمسة أيام أو أقل. إذا تجاوزت المدة فالتنبيه عند القطاع.", "You get an alert at halfway, and another when five days or fewer remain. Once the date passes, the alert belongs to the Sector.")}
      >
        {sector ? <Link className="btn btn-primary" href={`/reports${reportQuery}`}>{tx(locale, "تقرير التجاوز", "Overdue report")}</Link> : null}
      </PageHeader>
      {sector ? (
        <form className="filters" action="/alerts">
          <label className="field">
            <span>{tx(locale, "الإدارة", "Department")}</span>
            <SelectBox name="department" defaultValue={query.department ?? ""} options={[{ value: "", label: tx(locale, "الكل", "All") }, ...options.departments.map((department) => ({ value: department.id, label: locName(locale, department.nameAr, department.nameEn) }))]} />
          </label>
          <label className="field">
            <span>{tx(locale, "المرحلة", "Stage")}</span>
            <SelectBox
              name="stage"
              defaultValue={query.stage ?? ""}
              options={[
                { value: "", label: tx(locale, "الكل", "All") },
                { value: "PUBLICATION", label: tx(locale, "النشر", "Publication") },
                { value: "TECHNICAL_OPENING", label: tx(locale, "الفتح الفني", "Technical opening") },
                { value: "FINANCIAL_OPENING", label: tx(locale, "الفتح المالي", "Financial opening") },
                { value: "FINANCIAL_AWARD", label: tx(locale, "البت المالي", "Financial award") },
              ]}
            />
          </label>
          <button className="btn btn-primary" type="submit">{tx(locale, "تصفية", "Filter")}</button>
        </form>
      ) : null}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{tx(locale, "النوع", "Type")}</th>
              <th>{tx(locale, "العملية", "Operation")}</th>
              <th>{tx(locale, "الإدارة", "Department")}</th>
              <th>{tx(locale, "المرحلة", "Stage")}</th>
              <th>{tx(locale, "المخطط", "Plan")}</th>
              <th>{tx(locale, "المدة", "Time")}</th>
              {sector ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {view.total === 0 ? <tr><td colSpan={sector ? 7 : 6} className="empty">{tx(locale, "لا تنبيهات في هذا النطاق.", "No alerts in this view.")}</td></tr> : view.rows.map((row) => (
              <tr key={row.id}>
                <td>{alertLabel(locale, row.type)}</td>
                <td><Link className="link" href={`/operations/${row.operationId}`}>{locName(locale, row.operationAr, row.operationEn)}</Link></td>
                <td>{locName(locale, row.departmentAr, row.departmentEn)}</td>
                <td>{locName(locale, row.stageAr, row.stageEn)}</td>
                <td className="num">{formatDate(row.plannedStart)} – {formatDate(row.plannedDue)}</td>
                <td>{row.daysLate > 0 ? tx(locale, `متأخر ${daysPhrase(locale, row.daysLate)}`, `${daysPhrase(locale, row.daysLate)} late`) : tx(locale, `متبقٍ ${daysPhrase(locale, row.daysRemaining)}`, `${daysPhrase(locale, row.daysRemaining)} left`)}</td>
                {sector ? (
                  <td>
                    <form action={deleteAlertAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <button className="btn btn-danger btn-sm" type="submit">{tx(locale, "حذف", "Delete")}</button>
                    </form>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager locale={locale} page={view.page} pages={view.pages} total={view.total} from={view.from} to={view.to} size={view.size} base="/alerts" params={{ department: query.department, stage: query.stage }} />
    </>
  );
}
