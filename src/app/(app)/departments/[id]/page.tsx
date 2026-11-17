import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FundingTrancheForm } from "@/components/funding-tranche-form";
import { Tip } from "@/components/tip";
import { PageHeader, StatusChip } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { roleHint, roleLabel, statusHint } from "@/lib/labels";
import { getLocale } from "@/lib/locale";
import { formatMoney } from "@/lib/money";
import { can, canSeeUserAccount, isDepartmentRole, sectorFacingStatus } from "@/lib/permissions";
import { getDepartmentDetail } from "@/lib/queries";
import { locName, tx } from "@/lib/text";

export default async function DepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (isDepartmentRole(user.role) && user.departmentId !== id) redirect("/");
  if (!isDepartmentRole(user.role) && !can(user, "departments.view")) redirect("/");
  const locale = await getLocale();
  const detail = await getDepartmentDetail(id);
  if (!detail) notFound();
  const { department, assignments } = detail;
  const sectorView = !isDepartmentRole(user.role);
  const canEditFunding = can(user, "finance.manage");

  return (
    <>
      <PageHeader
        kicker={tx(locale, "إدارة", "Department")}
        title={locName(locale, department.nameAr, department.nameEn)}
        lede={tx(locale, "العمليات المخصصة لهذه الإدارة وحساباتها ودفعات الاعتماد.", "Operations assigned to this department, accounts, and funding tranches.")}
      />
      <section className="card card-pad stack">
        <h2>{tx(locale, "الحسابات", "Accounts")}</h2>
        {department.users.length === 0 ? (
          <p className="empty">{tx(locale, "لا حسابات بعد.", "No accounts yet.")}</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <tbody>
                {department.users.filter((account) => canSeeUserAccount(user, account)).map((account) => (
                  <tr key={account.id}>
                    <td>
                      {locName(locale, account.nameAr, account.nameEn)}
                      <div className="fine">{account.email}</div>
                    </td>
                    <td>
                      <Tip text={roleHint(locale, account.role)}>
                        <span className={account.role.includes("DEPARTMENT") ? "chip halfway" : "chip gold"}>{roleLabel(locale, account.role)}</span>
                      </Tip>
                    </td>
                    <td>
                      <Tip text={statusHint(locale, account.isActive ? "active" : "inactive")}>
                        <span className={account.isActive ? "chip on_track" : "chip overdue"}>
                          {account.isActive ? tx(locale, "نشط", "Active") : tx(locale, "موقوف", "Inactive")}
                        </span>
                      </Tip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="stack">
        <h2>{tx(locale, "العمليات", "Operations")}</h2>
        {assignments.length === 0 ? (
          <p className="empty">{tx(locale, "لا عمليات مخصصة.", "No assigned operations.")}</p>
        ) : (
          assignments.map((item) => {
            const face = sectorFacingStatus(item.assignment.status);
            const statusForChip = face === "overdue" ? "overdue" : face === "completed" ? "completed" : "on_track";
            return (
              <article key={item.assignment.id} className="card card-pad stack">
                <Link href={`/operations/${item.operationId}?department=${id}`} className="between" style={{ textDecoration: "none" }}>
                  <span>
                    <b>{locName(locale, item.operationAr, item.operationEn)}</b>
                    <div className="fine">
                      {locName(locale, item.typeAr, item.typeEn)} · {formatDate(item.approvalDate)} · {formatMoney(item.assignment.currentAmount, locale)}
                    </div>
                  </span>
                  {sectorView ? (
                    <span className={`chip ${statusForChip}`}>
                      {face === "overdue" ? tx(locale, "متأخرة", "Overdue") : face === "completed" ? tx(locale, "مكتملة", "Completed") : tx(locale, "في التنفيذ", "In execution")}
                    </span>
                  ) : (
                    <StatusChip locale={locale} status={item.assignment.status} />
                  )}
                </Link>
                {item.assignment.fundingTranches.length ? (
                  <div className="table-wrap">
                    <table className="data">
                      <thead>
                        <tr>
                          <th>{tx(locale, "دفعة اعتماد", "Funding tranche")}</th>
                          <th>{tx(locale, "التاريخ", "Date")}</th>
                          <th>{tx(locale, "المبلغ", "Amount")}</th>
                          <th>{tx(locale, "ملاحظة", "Note")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.assignment.fundingTranches.map((tranche) => (
                          <tr key={tranche.id}>
                            <td>#{tranche.sequence}</td>
                            <td className="num">{formatDate(tranche.sentAt)}</td>
                            <td className="num">{formatMoney(tranche.amount, locale)}</td>
                            <td>{tranche.note ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {canEditFunding ? <FundingTrancheForm operationDepartmentId={item.assignment.id} /> : null}
              </article>
            );
          })
        )}
      </section>
    </>
  );
}
