import Link from "next/link";
import { redirect } from "next/navigation";
import { Pager } from "@/components/pager";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate, formatStamp } from "@/lib/format";
import { fieldLabel } from "@/lib/labels";
import { getLocale } from "@/lib/locale";
import { getPageSize } from "@/lib/page-size";
import { pageOf } from "@/lib/paging";
import { can } from "@/lib/permissions";
import { listRevisions } from "@/lib/queries";
import { markRevisionsSeenAction } from "@/server/actions";
import { locName, tx } from "@/lib/text";

export default async function RevisionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  if (!can(user, "revisions.view")) redirect("/");
  const locale = await getLocale();
  const query = await searchParams;
  const size = await getPageSize();
  const rows = await listRevisions();
  const view = pageOf(rows, query.page, size);
  const unseen = rows.filter((row) => !row.seenAt).length;
  return (
    <>
      <PageHeader kicker={tx(locale, "اطلاع", "Review")} title={tx(locale, "تعديلات المواعيد", "Date revisions")} lede={tx(locale, "الإدارة تعدل البدء أو النهو وتكتب السبب فورًا. القطاع يطلع على السبب دون بوابة موافقة.", "A department changes the start or finish and must write a reason. The Sector reviews the reason; there is no approval gate.")}>
        <form action={markRevisionsSeenAction}><button className="btn btn-primary" type="submit">{tx(locale, `تعليم الكل (${unseen})`, `Mark all seen (${unseen})`)}</button></form>
      </PageHeader>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{tx(locale, "متى", "When")}</th>
              <th>{tx(locale, "العملية", "Operation")}</th>
              <th>{tx(locale, "الإدارة / المرحلة", "Department / stage")}</th>
              <th>{tx(locale, "التعديل", "Change")}</th>
              <th>{tx(locale, "السبب", "Reason")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {view.total === 0 ? <tr><td colSpan={6} className="empty">{tx(locale, "لا تعديلات مسجلة.", "No revisions yet.")}</td></tr> : view.rows.map((row) => (
              <tr key={row.id}>
                <td>{formatStamp(row.createdAt, locale)}<div className="fine">{locName(locale, row.actorAr, row.actorEn)}</div></td>
                <td><Link className="link" href={`/operations/${row.operationId}`}>{locName(locale, row.operationAr, row.operationEn)}</Link></td>
                <td>{locName(locale, row.departmentAr, row.departmentEn)}<div className="fine">{locName(locale, row.stageAr, row.stageEn)}</div></td>
                <td>{fieldLabel(locale, row.field)}<div className="num">{formatDate(row.oldDate)} → {formatDate(row.newDate)}</div></td>
                <td>{row.reason}</td>
                <td>
                  {row.seenAt ? <span className="chip completed">{tx(locale, "شوهد", "Seen")}</span> : (
                    <form action={markRevisionsSeenAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <button className="btn btn-gold btn-sm" type="submit">{tx(locale, "تمت المشاهدة", "Mark seen")}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager locale={locale} page={view.page} pages={view.pages} total={view.total} from={view.from} to={view.to} size={view.size} base="/revisions" params={{}} />
    </>
  );
}
