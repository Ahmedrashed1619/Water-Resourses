import { redirect } from "next/navigation";
import { Pager } from "@/components/pager";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatStamp } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import { getPageSize } from "@/lib/page-size";
import { pageOf } from "@/lib/paging";
import { can } from "@/lib/permissions";
import { listAudit } from "@/lib/queries";
import { actionLabel } from "@/lib/labels";
import { locName, tx } from "@/lib/text";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  if (!can(user, "audit.view")) redirect("/");
  const locale = await getLocale();
  const query = await searchParams;
  const size = await getPageSize();
  const rows = await listAudit();
  const view = pageOf(rows, query.page, size);
  return (
    <>
      <PageHeader kicker={tx(locale, "الأثر", "Trace")} title={tx(locale, "سجل النشاط", "Activity log")} lede={tx(locale, "من أنشأ عملية أو عدّل اعتمادًا أو أضاف مستخدمًا.", "Who created an operation, adjusted an approval, or added a user.")} />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{tx(locale, "الوقت", "Time")}</th>
              <th>{tx(locale, "المستخدم", "User")}</th>
              <th>{tx(locale, "الإجراء", "Action")}</th>
              <th>{tx(locale, "الأثر", "Summary")}</th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row) => (
              <tr key={row.id}>
                <td>{formatStamp(row.createdAt.toISOString(), locale)}</td>
                <td>{row.actor ? locName(locale, row.actor.nameAr, row.actor.nameEn) : "—"}</td>
                <td>{actionLabel(locale, row.action)}</td>
                <td>{locale === "ar" ? row.summaryAr : row.summaryEn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager locale={locale} page={view.page} pages={view.pages} total={view.total} from={view.from} to={view.to} size={view.size} base="/audit" params={{}} />
    </>
  );
}
