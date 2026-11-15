import Link from "next/link";
import { DashList, DashListItem } from "@/components/dash-list";
import { DashboardCharts } from "@/components/dashboard-charts";
import { StatCard } from "@/components/stat-card";
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
  const alertsHeading = "dash-alerts-heading";
  const opsHeading = "dash-ops-heading";

  return (
    <>
      <PageHeader
        kicker={department ? locName(locale, user.department?.nameAr ?? "", user.department?.nameEn) : tx(locale, "قطاع الري", "Irrigation Sector")}
        title={department ? tx(locale, "عمليات الإدارة", "Department operations") : tx(locale, "متابعة التعاقدات", "Contract follow-up")}
        lede={department
          ? tx(locale, "ترى عمليات إدارتك فقط. تنبيها منتصف المدة وقبل خمسة أيام يصلان إليك، وتجاوز المدة يصل إلى القطاع.", "You only see your department. Halfway and five-day alerts come to you; overdue alerts go to the Sector.")
          : tx(locale, "ثلاث وثلاثون إدارة. التأخير يُحسب على الموعد المخطط لكل مرحلة، والمرحلة المنتهية لا تُنبّه.", "Thirty-three departments. Delay is measured against each stage plan, and a completed stage raises no alert.")}
      >
        {can(user, "operations.manage") && !department ? (
          <Link className="btn btn-primary page-cta" href="/operations?new=1">
            {tx(locale, "عملية جديدة", "New operation")}
          </Link>
        ) : null}
      </PageHeader>

      {department && data.kpis.delayedDepartments > 0 ? (
        <p className="banner warn" role="status">
          {tx(locale, "توجد مرحلة تجاوزت المدة. الحالة ظاهرة على العملية، والتنبيه نفسه يصل إلى القطاع.", "A stage is past its plan. The status shows on the operation, and the alert itself goes to the Sector.")}
        </p>
      ) : null}

      <section className="stat-grid" aria-label={tx(locale, "مؤشرات سريعة", "Quick indicators")}>
        <StatCard label={tx(locale, "عمليات جارية", "Open operations")} value={data.kpis.activeOperations} />
        <StatCard
          tone="danger"
          label={department ? tx(locale, "تنبيهات الإدارة", "Department alerts") : tx(locale, "تنبيهات التجاوز", "Overdue alerts")}
          value={data.kpis.alerts}
        />
        <StatCard tone="gold" label={tx(locale, "الاعتماد الحالي", "Current approval")} value={formatMoney(data.kpis.finance, locale)} />
        <StatCard
          label={department ? tx(locale, "إدارات متأخرة لديك", "Your delayed work") : tx(locale, "إدارات عليها تأخير", "Departments delayed")}
          value={data.kpis.delayedDepartments}
        />
      </section>

      <DashboardCharts
        status={data.charts.status}
        types={data.charts.types}
        alerts={data.charts.alerts}
        departments={data.charts.departments}
      />

      <section className="split">
        <div className="card card-pad stack">
          <div className="between">
            <h2 id={alertsHeading}>{tx(locale, "أحدث التنبيهات", "Latest alerts")}</h2>
            <Link className="link" href="/alerts">{tx(locale, "الكل", "All")}</Link>
          </div>
          {data.alerts.length === 0 ? (
            <p className="empty">{tx(locale, "لا تنبيهات مفتوحة.", "No open alerts.")}</p>
          ) : (
            <DashList labelledBy={alertsHeading}>
              {data.alerts.map((alert) => (
                <DashListItem
                  key={alert.id}
                  href={`/operations/${alert.operationId}`}
                  title={locName(locale, alert.operationAr, alert.operationEn)}
                  meta={`${locName(locale, alert.departmentAr, alert.departmentEn)} · ${locName(locale, alert.stageAr, alert.stageEn)}`}
                  trailing={<em className="num">{alert.daysLate > 0 ? `+${alert.daysLate}` : formatDate(alert.plannedDue)}</em>}
                />
              ))}
            </DashList>
          )}
        </div>

        <div className="card card-pad stack">
          <h2 id={opsHeading}>{tx(locale, "عمليات حديثة", "Recent operations")}</h2>
          {data.operations.length === 0 ? (
            <p className="empty">{tx(locale, "لم تُخصص عمليات بعد.", "No operations have been assigned yet.")}</p>
          ) : (
            <DashList labelledBy={opsHeading}>
              {data.operations.map((item) => (
                <DashListItem
                  key={item.id}
                  href={`/operations/${item.id}`}
                  title={locName(locale, item.nameAr, item.nameEn)}
                  meta={`${formatDate(item.approvalDate)} · ${locName(locale, item.typeAr, item.typeEn)}`}
                  trailing={<StatusChip locale={locale} status={item.status} />}
                />
              ))}
            </DashList>
          )}
          {!department && data.kpis.unseenRevisions > 0 ? (
            <Link className="banner" href="/revisions" role="status">
              {tx(locale, `${data.kpis.unseenRevisions} تعديل مواعيد بانتظار الاطلاع`, `${data.kpis.unseenRevisions} date revisions waiting for review`)}
            </Link>
          ) : null}
        </div>
      </section>

      {data.departments.length ? (
        <section className="stack" aria-labelledby="dept-board-heading">
          <h2 id="dept-board-heading">{tx(locale, "خريطة الإدارات", "Department board")}</h2>
          <div className="dept-board">
            {data.departments.map((item) => (
              <Link key={item.id} href={`/departments/${item.id}`} className="dept-cell">
                <span className={`dot ${item.status}`} aria-hidden="true" />
                <span>
                  <b>{locName(locale, item.nameAr, item.nameEn)}</b>
                  <small>
                    {item.operations === 0
                      ? tx(locale, "بدون عمليات", "No operations")
                      : item.operations === 1
                        ? tx(locale, "عملية واحدة", "1 operation")
                        : tx(locale, `${item.operations} عمليات`, `${item.operations} operations`)}
                    {item.overdueStages ? tx(locale, ` · ${item.overdueStages} متأخرة`, ` · ${item.overdueStages} overdue`) : ""}
                  </small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
