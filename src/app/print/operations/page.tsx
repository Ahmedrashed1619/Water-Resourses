import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { formatDate, formatLongDate } from "@/lib/format";
import { statusLabel } from "@/lib/labels";
import { getLocale } from "@/lib/locale";
import { formatMoney } from "@/lib/money";
import { can } from "@/lib/permissions";
import { listOperationExportRows } from "@/lib/queries";
import { locName, tx } from "@/lib/text";
import { PrintActions } from "@/components/print-actions";

export const dynamic = "force-dynamic";

export default async function PrintOperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; department?: string; status?: string; overdue?: string }>;
}) {
  const user = await requireUser();
  if (!can(user, "reports.print") && !can(user, "reports.export") && !can(user, "reports.overrun")) redirect("/");
  const locale = await getLocale();
  const query = await searchParams;
  const overdueOnly = query.overdue === "1";
  if (overdueOnly && !can(user, "reports.overrun") && !can(user, "reports.export")) redirect("/");
  const rows = await listOperationExportRows(user, {
    q: query.q,
    typeId: query.type,
    departmentId: query.department,
    status: overdueOnly ? "overdue" : query.status,
  });
  const title = overdueOnly
    ? tx(locale, "تقرير التجاوز", "Overrun report")
    : tx(locale, "تقرير العمليات", "Operations report");

  return (
    <div className="print-sheet">
      <PrintActions />
      <header className="print-head">
        <div>
          <div className="sheet-kicker">
            {locale === "ar"
              ? "وزارة الموارد المائية والري · قطاع الري"
              : "Ministry of Water Resources and Irrigation · Irrigation Sector"}
          </div>
          <h1>{title}</h1>
          <div>
            {formatLongDate(todayISO(), locale)} · {rows.length}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/sector.jpg" alt="" width={64} height={64} />
      </header>
      <table className="print-table">
        <thead>
          <tr>
            <th>{tx(locale, "العملية", "Operation")}</th>
            <th>{tx(locale, "النوع", "Type")}</th>
            <th>{tx(locale, "الإدارة", "Department")}</th>
            <th>{tx(locale, "الموافقة", "Approval")}</th>
            <th>{tx(locale, "الاعتماد", "Amount")}</th>
            <th>{tx(locale, "الحالة", "Status")}</th>
            <th>{tx(locale, "دفعات الاعتماد", "Funding tranches")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7}>{tx(locale, "لا بيانات.", "No data.")}</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row.operationId}-${index}`}>
                <td>{locName(locale, row.operationAr, row.operationEn)}</td>
                <td>{locName(locale, row.typeAr, row.typeEn)}</td>
                <td>{locName(locale, row.departmentAr, row.departmentEn)}</td>
                <td>{formatDate(row.approvalDate)}</td>
                <td>{formatMoney(row.currentAmount, locale)}</td>
                <td>{statusLabel(locale, row.status)}</td>
                <td>{row.tranchesSummary || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
