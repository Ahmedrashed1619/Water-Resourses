import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NeedRespondForm } from "@/components/need-respond-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import { needStatusLabel, needSupportLabel } from "@/lib/need-labels";
import { formatMoney } from "@/lib/money";
import { collectNeedRequestWarnings } from "@/lib/needs-rules";
import { can, isDepartmentRole } from "@/lib/permissions";
import { countSimilarNeedsInFy, getNeedRequest, listLinkableOperations } from "@/lib/queries";
import { dateToIso } from "@/lib/dates";
import { locName, tx } from "@/lib/text";

export default async function NeedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!can(user, "needs.view") && !can(user, "needs.create") && !can(user, "needs.respond")) redirect("/");
  const { id } = await params;
  const locale = await getLocale();
  const row = await getNeedRequest(user, id);
  if (!row) notFound();

  const similarCount = await countSimilarNeedsInFy(
    row.departmentId,
    row.operationTypeId,
    row.desiredStartDate ? dateToIso(row.desiredStartDate) : null,
    row.id,
  );
  const warnings = collectNeedRequestWarnings({
    desiredStartIso: row.desiredStartDate ? dateToIso(row.desiredStartDate) : null,
    hasSimilarInSameFy: similarCount > 0,
  });
  const canRespond =
    can(user, "needs.respond") &&
    !isDepartmentRole(user.role) &&
    row.status !== "REJECTED" &&
    row.status !== "FULFILLED" &&
    (row.status === "SUBMITTED" || row.status === "UNDER_REVIEW");
  const operations = canRespond ? await listLinkableOperations(user) : [];

  return (
    <>
      <PageHeader
        kicker={tx(locale, "طلب احتياج", "Needs request")}
        title={row.title}
        lede={locName(locale, row.department.nameAr, row.department.nameEn)}
      >
        <Link className="btn" href="/needs">
          {tx(locale, "رجوع", "Back")}
        </Link>
      </PageHeader>

      <section className="card card-pad stack">
        <div className="between">
          <span className={`chip ${row.status === "REJECTED" ? "overdue" : row.status.includes("APPROVED") ? "on_track" : "halfway"}`}>
            {needStatusLabel(locale, row.status)}
          </span>
          <span className="fine">{formatDate(row.createdAt.toISOString().slice(0, 10))}</span>
        </div>
        <div className="grid-2">
          <div>
            <div className="fine">{tx(locale, "نوع العملية", "Operation type")}</div>
            <b>{locName(locale, row.operationType.nameAr, row.operationType.nameEn)}</b>
          </div>
          <div>
            <div className="fine">{tx(locale, "الدعم المطلوب", "Requested support")}</div>
            <b>{needSupportLabel(locale, row.requestedSupport)}</b>
          </div>
          <div>
            <div className="fine">{tx(locale, "مقدّم الطلب", "Submitted by")}</div>
            <b>{locName(locale, row.createdBy.nameAr, row.createdBy.nameEn)}</b>
          </div>
          <div>
            <div className="fine">{tx(locale, "القيمة التقديرية", "Estimated value")}</div>
            <b>{row.estimatedValue ? formatMoney(row.estimatedValue, locale) : "—"}</b>
          </div>
          <div>
            <div className="fine">{tx(locale, "تاريخ البدء المرغوب", "Desired start")}</div>
            <b>{row.desiredStartDate ? formatDate(dateToIso(row.desiredStartDate)) : "—"}</b>
          </div>
          <div>
            <div className="fine">{tx(locale, "المدة المتوقعة", "Expected duration")}</div>
            <b>{row.expectedDurationDays ? tx(locale, `${row.expectedDurationDays} يومًا`, `${row.expectedDurationDays} days`) : "—"}</b>
          </div>
        </div>
        <div>
          <div className="fine">{tx(locale, "المتطلبات", "Requirements")}</div>
          <p style={{ whiteSpace: "pre-wrap" }}>{row.requirements}</p>
        </div>
        {row.description ? (
          <div>
            <div className="fine">{tx(locale, "الوصف", "Description")}</div>
            <p style={{ whiteSpace: "pre-wrap" }}>{row.description}</p>
          </div>
        ) : null}
        {warnings.map((item) => (
          <p key={item.code} className="banner warn" role="status">
            {locale === "ar" ? item.ar : item.en}
          </p>
        ))}
        {row.reviewedAt ? (
          <div className="stack">
            <b>{tx(locale, "قرار القطاع", "Sector decision")}</b>
            <p>
              {row.reviewedBy ? locName(locale, row.reviewedBy.nameAr, row.reviewedBy.nameEn) : "—"} ·{" "}
              {formatDate(row.reviewedAt.toISOString().slice(0, 10))}
            </p>
            {row.decisionNote ? <p style={{ whiteSpace: "pre-wrap" }}>{row.decisionNote}</p> : null}
            {row.approvedAmount ? <p>{formatMoney(row.approvedAmount, locale)}</p> : null}
            {row.linkedOperation ? (
              <p>
                <Link className="link" href={`/operations/${row.linkedOperation.id}`}>
                  {locName(locale, row.linkedOperation.nameAr, row.linkedOperation.nameEn)}
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {canRespond ? (
        <NeedRespondForm requestId={row.id} departmentId={row.departmentId} operations={operations} />
      ) : null}
    </>
  );
}
