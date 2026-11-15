import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader, StatusChip } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { getLocale } from "@/lib/locale";
import { roleHint, roleLabel, statusHint } from "@/lib/labels";
import { isDepartmentRole } from "@/lib/permissions";
import { Tip } from "@/components/tip";
import { getDepartmentDetail } from "@/lib/queries";
import { locName, tx } from "@/lib/text";

export default async function DepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (isDepartmentRole(user.role) && user.departmentId !== id) redirect("/");
  const locale = await getLocale();
  const detail = await getDepartmentDetail(id);
  if (!detail) notFound();
  const { department, assignments } = detail;
  return (
    <>
      <PageHeader kicker={tx(locale, "إدارة", "Department")} title={locName(locale, department.nameAr, department.nameEn)} lede={tx(locale, "العمليات المخصصة لهذه الإدارة وحساباتها.", "Operations assigned to this department, and its accounts.")} />
      <section className="card card-pad stack">
        <h2>{tx(locale, "الحسابات", "Accounts")}</h2>
        {department.users.length === 0 ? <p className="empty">{tx(locale, "لا حسابات بعد.", "No accounts yet.")}</p> : (
          <div className="table-wrap">
            <table className="data">
              <tbody>
                {department.users.map((account) => (
                  <tr key={account.id}>
                    <td>{locName(locale, account.nameAr, account.nameEn)}<div className="fine">{account.email}</div></td>
                    <td><Tip text={roleHint(locale, account.role)}><span className={account.role.includes("DEPARTMENT") || account.role === "DEPARTMENT" ? "chip halfway" : "chip gold"}>{roleLabel(locale, account.role)}</span></Tip></td>
                    <td><Tip text={statusHint(locale, account.isActive ? "active" : "inactive")}><span className={account.isActive ? "chip on_track" : "chip overdue"}>{account.isActive ? tx(locale, "نشط", "Active") : tx(locale, "موقوف", "Inactive")}</span></Tip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="stack">
        <h2>{tx(locale, "العمليات", "Operations")}</h2>
        {assignments.length === 0 ? <p className="empty">{tx(locale, "لا عمليات مخصصة.", "No assigned operations.")}</p> : assignments.map((item) => (
          <Link key={item.assignment.id} href={`/operations/${item.operationId}`} className="card card-pad between" style={{ textDecoration: "none" }}>
            <span>
              <b>{locName(locale, item.operationAr, item.operationEn)}</b>
              <div className="fine">{locName(locale, item.typeAr, item.typeEn)} · {formatDate(item.approvalDate)} · {formatMoney(item.assignment.currentAmount, locale)}</div>
            </span>
            <StatusChip locale={locale} status={item.assignment.status} />
          </Link>
        ))}
      </section>
    </>
  );
}
