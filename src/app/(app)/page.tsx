import Link from "next/link";
import { PageHeader, StatusChip } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { getLocale } from "@/lib/locale";
import { can, isDepartmentRole } from "@/lib/permissions";
import { getDashboard } from "@/lib/queries";
import { locName, tx } from "@/lib/text";

export default async function DashboardPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const data = await getDashboard(user);
  const department = isDepartmentRole(user.role);
  return (
    <>
      <PageHeader
        kicker={department ? locName(locale, user.department?.nameAr ?? "", user.department?.nameEn) : tx(locale, "قطاع الري", "Irrigation Sector")}
        title={department ? tx(locale, "عمليات الإدارة", "Department operations") : tx(locale, "متابعة التعاقدات", "Contract follow-up")}
        lede={department
          ? tx(locale, "ترى عمليات إدارتك فقط. تنبيها منتصف المدة وقبل خمسة أيام يصلان إليك، وتجاوز المدة يصل إلى القطاع.", "You only see your department. Halfway and five-day alerts come to you; overdue alerts go to the Sector.")
          : tx(locale, "ثلاث وثلاثون إدارة. التأخير يُحسب على الموعد المخطط لكل مرحلة، والمرحلة المنتهية لا تُنبّه.", "Thirty-three departments. Delay is measured against each stage plan, and a completed stage raises no alert.")}
      >
        {can(user, "operations.manage") && !department ? <Link className="btn btn-primary" href="/operations?new=1">{tx(locale, "عملية جديدة", "New operation")}</Link> : null}
      </PageHeader>
      {department && data.kpis.delayedDepartments > 0 ? (
        <p className="banner warn">{tx(locale, "توجد مرحلة تجاوزت المدة. الحالة ظاهرة على العملية، والتنبيه نفسه يصل إلى القطاع.", "A stage is past its plan. The status shows on the operation, and the alert itself goes to the Sector.")}</p>
      ) : null}
      <section className="stat-grid">
        <article className="card stat"><div className="label">{tx(locale, "عمليات جارية", "Open operations")}</div><div className="value">{data.kpis.activeOperations}</div></article>
        <article className="card stat danger"><div className="label">{department ? tx(locale, "تنبيهات الإدارة", "Department alerts") : tx(locale, "تنبيهات التجاوز", "Overdue alerts")}</div><div className="value">{data.kpis.alerts}</div></article>
        <article className="card stat gold"><div className="label">{tx(locale, "الاعتماد الحالي", "Current approval")}</div><div className="value" style={{ fontSize: 20 }}>{formatMoney(data.kpis.finance, locale)}</div></article>
        <article className="card stat"><div className="label">{department ? tx(locale, "إدارات متأخرة لديك", "Your delayed work") : tx(locale, "إدارات عليها تأخير", "Departments delayed")}</div><div className="value">{data.kpis.delayedDepartments}</div></article>
      </section>
      <section className="split">
        <div className="card card-pad stack">
          <div className="between"><h2>{tx(locale, "أحدث التنبيهات", "Latest alerts")}</h2><Link className="link" href="/alerts">{tx(locale, "الكل", "All")}</Link></div>
          {data.alerts.length === 0 ? <p className="empty">{tx(locale, "لا تنبيهات مفتوحة.", "No open alerts.")}</p> : (
            <div className="table-wrap">
              <table className="data">
                <tbody>
                  {data.alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td><Link className="link" href={`/operations/${alert.operationId}`}>{locName(locale, alert.operationAr, alert.operationEn)}</Link><div className="fine">{locName(locale, alert.departmentAr, alert.departmentEn)} · {locName(locale, alert.stageAr, alert.stageEn)}</div></td>
                      <td className="num">{alert.daysLate > 0 ? tx(locale, `+${alert.daysLate}`, `+${alert.daysLate}`) : formatDate(alert.plannedDue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card card-pad stack">
          <h2>{tx(locale, "عمليات حديثة", "Recent operations")}</h2>
          {data.operations.length === 0 ? <p className="empty">{tx(locale, "لم تُخصص عمليات بعد.", "No operations have been assigned yet.")}</p> : data.operations.map((item) => (
            <Link key={item.id} href={`/operations/${item.id}`} className="between" style={{ textDecoration: "none" }}>
              <span><b>{locName(locale, item.nameAr, item.nameEn)}</b><br /><span className="fine">{formatDate(item.approvalDate)} · {locName(locale, item.typeAr, item.typeEn)}</span></span>
              <StatusChip locale={locale} status={item.status} />
            </Link>
          ))}
          {!department && data.kpis.unseenRevisions > 0 ? <Link className="banner" href="/revisions">{tx(locale, `${data.kpis.unseenRevisions} تعديل مواعيد بانتظار الاطلاع`, `${data.kpis.unseenRevisions} date revisions waiting for review`)}</Link> : null}
        </div>
      </section>
      {data.departments.length ? (
        <section className="stack">
          <h2>{tx(locale, "خريطة الإدارات", "Department board")}</h2>
          <div className="dept-board">
            {data.departments.map((item) => (
              <Link key={item.id} href={`/departments/${item.id}`} className="dept-cell">
                <span className={`dot ${item.status}`} />
                <span><b>{locName(locale, item.nameAr, item.nameEn)}</b><small>{item.operations === 0 ? tx(locale, "بدون عمليات", "No operations") : item.operations === 1 ? tx(locale, "عملية واحدة", "1 operation") : tx(locale, `${item.operations} عمليات`, `${item.operations} operations`)}{item.overdueStages ? tx(locale, ` · ${item.overdueStages} متأخرة`, ` · ${item.overdueStages} overdue`) : ""}</small></span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
