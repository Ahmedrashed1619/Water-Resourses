import Link from "next/link";
import { redirect } from "next/navigation";
import { NeedRequestForm } from "@/components/need-request-form";
import { SelectBox } from "@/components/select-box";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import { needStatusLabel, needSupportLabel } from "@/lib/need-labels";
import { formatMoney } from "@/lib/money";
import { can, isDepartmentRole } from "@/lib/permissions";
import { countSimilarNeedsInFy, filterOptions, listNeedRequests, listTypes } from "@/lib/queries";
import { todayISO } from "@/lib/dates";
import { locName, tx } from "@/lib/text";

export default async function NeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; department?: string; new?: string }>;
}) {
  const user = await requireUser();
  if (!can(user, "needs.view") && !can(user, "needs.create") && !can(user, "needs.respond")) redirect("/");
  const locale = await getLocale();
  const query = await searchParams;
  const canCreate = can(user, "needs.create") && isDepartmentRole(user.role);
  const [rows, options, types] = await Promise.all([
    listNeedRequests(user, { status: query.status, departmentId: query.department }),
    filterOptions(),
    canCreate ? listTypes() : Promise.resolve([]),
  ]);

  let similarTypeIds: string[] = [];
  if (canCreate && user.departmentId) {
    const activeTypes = types.filter((t) => t.isActive && !t.deletedAt);
    const counts = await Promise.all(
      activeTypes.map(async (type) => ({
        id: type.id,
        count: await countSimilarNeedsInFy(user.departmentId!, type.id, todayISO()),
      })),
    );
    similarTypeIds = counts.filter((item) => item.count > 0).map((item) => item.id);
  }

  return (
    <>
      <PageHeader
        kicker={tx(locale, "احتياج العمليات", "Operation needs")}
        title={tx(locale, "طلبات احتياج العمليات", "Operation needs requests")}
        lede={tx(
          locale,
          "تقدّم الإدارات طلباتها؛ القطاع يرد بالدعم دون إنشاء عملية تلقائيًا.",
          "Departments submit requests; the Sector responds with support without auto-creating an operation.",
        )}
      >
        {canCreate ? (
          <Link className="btn btn-primary" href="/needs?new=1">
            {tx(locale, "طلب جديد", "New request")}
          </Link>
        ) : null}
      </PageHeader>

      {canCreate && query.new === "1" ? (
        <NeedRequestForm
          types={types.filter((t) => t.isActive && !t.deletedAt).map((t) => ({ id: t.id, nameAr: t.nameAr, nameEn: t.nameEn }))}
          similarTypeIds={similarTypeIds}
        />
      ) : null}

      <form className="filters" action="/needs">
        <label className="field">
          <span>{tx(locale, "الحالة", "Status")}</span>
          <SelectBox
            name="status"
            defaultValue={query.status ?? ""}
            options={[
              { value: "", label: tx(locale, "الكل", "All") },
              { value: "SUBMITTED", label: needStatusLabel(locale, "SUBMITTED") },
              { value: "UNDER_REVIEW", label: needStatusLabel(locale, "UNDER_REVIEW") },
              { value: "APPROVED", label: needStatusLabel(locale, "APPROVED") },
              { value: "PARTIALLY_APPROVED", label: needStatusLabel(locale, "PARTIALLY_APPROVED") },
              { value: "REJECTED", label: needStatusLabel(locale, "REJECTED") },
              { value: "FULFILLED", label: needStatusLabel(locale, "FULFILLED") },
            ]}
          />
        </label>
        {!isDepartmentRole(user.role) ? (
          <label className="field">
            <span>{tx(locale, "الإدارة", "Department")}</span>
            <SelectBox
              name="department"
              defaultValue={query.department ?? ""}
              options={[
                { value: "", label: tx(locale, "الكل", "All") },
                ...options.departments.map((d) => ({
                  value: d.id,
                  label: locName(locale, d.nameAr, d.nameEn),
                })),
              ]}
            />
          </label>
        ) : null}
        <button className="btn btn-primary" type="submit">
          {tx(locale, "تصفية", "Filter")}
        </button>
      </form>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="col-name">{tx(locale, "العنوان", "Title")}</th>
              <th className="col-dept">{tx(locale, "الإدارة", "Department")}</th>
              <th className="col-type">{tx(locale, "النوع", "Type")}</th>
              <th>{tx(locale, "الدعم", "Support")}</th>
              <th className="col-status">{tx(locale, "الحالة", "Status")}</th>
              <th className="col-date">{tx(locale, "التاريخ", "Date")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">
                  {tx(locale, "لا طلبات في هذا النطاق.", "No requests in this view.")}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="col-name">
                    <Link className="link" href={`/needs/${row.id}`}>
                      {row.title}
                    </Link>
                    {row.estimatedValue ? <div className="fine">{formatMoney(row.estimatedValue, locale)}</div> : null}
                  </td>
                  <td className="col-dept">{locName(locale, row.department.nameAr, row.department.nameEn)}</td>
                  <td className="col-type">{locName(locale, row.operationType.nameAr, row.operationType.nameEn)}</td>
                  <td>{needSupportLabel(locale, row.requestedSupport)}</td>
                  <td className="col-status">
                    <span className={`chip ${row.status === "REJECTED" ? "overdue" : row.status.includes("APPROVED") ? "on_track" : "halfway"}`}>
                      {needStatusLabel(locale, row.status)}
                    </span>
                  </td>
                  <td className="num col-date">{formatDate(row.createdAt.toISOString().slice(0, 10))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
