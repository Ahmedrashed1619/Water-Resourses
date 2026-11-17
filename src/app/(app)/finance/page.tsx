import Link from "next/link";
import { redirect } from "next/navigation";
import { Pager } from "@/components/pager";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { addMoney, formatMoney } from "@/lib/money";
import { getLocale } from "@/lib/locale";
import { getPageSize } from "@/lib/page-size";
import { pageOf } from "@/lib/paging";
import { can } from "@/lib/permissions";
import { listFinanceRows } from "@/lib/queries";
import { locName, tx } from "@/lib/text";

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  if (!can(user, "finance.manage")) redirect("/");
  const locale = await getLocale();
  const query = await searchParams;
  const size = await getPageSize();
  const rows = await listFinanceRows(user);
  const view = pageOf(rows, query.page, size);
  const total = rows.reduce((sum, row) => addMoney(sum, row.assignment.currentAmount), "0.00");
  return (
    <>
      <PageHeader kicker={tx(locale, "الاعتماد", "Approval")} title={tx(locale, "الاعتماد المالي", "Financial approval")} lede={tx(locale, "القيمة الأصلية تبقى كما أُدخلت. كل تغيير يُسجل فرقًا بتاريخ، والسبب اختياري، ولا يُمسح.", "The original amount stays as entered. Every change is a dated delta. The reason is optional and the history is kept.")} />
      <article className="card stat gold"><div className="label">{tx(locale, "إجمالي القيم الحالية", "Total current value")}</div><div className="value" style={{ fontSize: 24 }}>{formatMoney(total, locale)}</div></article>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="col-name">{tx(locale, "العملية", "Operation")}</th>
              <th className="col-dept">{tx(locale, "الإدارة", "Department")}</th>
              <th className="col-money">{tx(locale, "الأصلي", "Original")}</th>
              <th className="col-money">{tx(locale, "الفروق", "Deltas")}</th>
              <th className="col-money">{tx(locale, "الحالي", "Current")}</th>
              <th className="col-date">{tx(locale, "الفترة", "Window")}</th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row) => (
              <tr key={row.assignment.id}>
                <td className="col-name"><Link className="link" href={`/operations/${row.operationId}`}>{locName(locale, row.operationAr, row.operationEn)}</Link><div className="fine">{formatDate(row.approvalDate)}</div></td>
                <td className="col-dept">{locName(locale, row.assignment.departmentAr, row.assignment.departmentEn)}</td>
                <td className="num">{formatMoney(row.assignment.approvedAmount, locale)}</td>
                <td className="num">{formatMoney(row.assignment.delta, locale)}<div className="fine">{row.assignment.adjustments.length}</div></td>
                <td className="num">{formatMoney(row.assignment.currentAmount, locale)}</td>
                <td className="num">{formatDate(row.assignment.approvalStart)} – {formatDate(row.assignment.approvalEnd)}{row.assignment.modifiedStart || row.assignment.modifiedEnd ? <div className="fine">{tx(locale, "معدل", "Revised")} {formatDate(row.assignment.modifiedStart ?? row.assignment.approvalStart)} – {formatDate(row.assignment.modifiedEnd ?? row.assignment.approvalEnd)}</div> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager locale={locale} page={view.page} pages={view.pages} total={view.total} from={view.from} to={view.to} size={view.size} base="/finance" params={{}} />
    </>
  );
}
