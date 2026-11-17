import Link from "next/link";
import { DashList, DashListItem } from "@/components/dash-list";
import { DashboardCharts } from "@/components/dashboard-charts";
import { StatCard } from "@/components/stat-card";
import { PageHeader, StatusChip } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { getLocale } from "@/lib/locale";
import { can, isDepartmentRole, sectorFacingStatus } from "@/lib/permissions";
import { getDashboard } from "@/lib/queries";
import { locName, tx } from "@/lib/text";

export default async function DashboardPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const data = await getDashboard(user);
  const department = isDepartmentRole(user.role);
  const alertsHeading = "dash-alerts-heading";
  const feedHeading = "dash-feed-heading";

  return (
    <>
      <PageHeader
        kicker={department ? locName(locale, user.department?.nameAr ?? "", user.department?.nameEn) : tx(locale, "قطاع الري", "Irrigation Sector")}
        title={department ? tx(locale, "عمليات الإدارة", "Department operations") : tx(locale, "متابعة التعاقدات", "Contract follow-up")}
        lede={department
          ? tx(locale, "ترى عمليات إدارتك فقط. تنبيها منتصف المدة وقبل خمسة أيام يصلان إليك، وتجاوز المدة يصل إلى القطاع.", "You only see your department. Halfway and five-day alerts come to you; overdue alerts go to the Sector.")
          : tx(locale, "التركيز على الإدارات المتأخرة وأسباب التأخير.", "Focus on late departments and why they are late.")}
      />

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

      <section className="stack" aria-labelledby="overdue-panel">
        <div>
          <h2 id="overdue-panel">{tx(locale, "العمليات المتأخرة", "Late operations")}</h2>
          <p className="note">{tx(locale, "حالة العمليات الآن — نسب وأعداد حسب الحالة والنوع والإدارة.", "How bad is it right now — shares and counts by status, type, and department.")}</p>
        </div>
        {data.isSector && data.overdueGroups.length === 0 && data.charts.status.every((s) => s.value === 0) ? (
          <p className="empty">{tx(locale, "لا توجد عمليات متأخرة.", "No late operations.")}</p>
        ) : (
          <DashboardCharts
            status={data.charts.status}
            types={data.charts.types}
            alerts={data.charts.alerts}
            departments={data.charts.departments}
          />
        )}
        {data.isSector && data.overdueGroups.length > 0 ? (
          <div className="stack">
            {data.overdueGroups.map((group) => {
              const latePct = Math.round((group.count / Math.max(1, group.count)) * 100);
              return (
                <Link
                  key={`${group.departmentId}-${group.typeAr}`}
                  href={`/operations?department=${group.departmentId}&status=LATE`}
                  className="card card-pad between"
                  style={{ textDecoration: "none" }}
                >
                  <span>
                    <b>{locName(locale, group.typeAr, group.typeEn)}</b>
                    <div className="fine">{locName(locale, group.departmentAr, group.departmentEn)}</div>
                  </span>
                  <span className="chip overdue">
                    {group.count} · {latePct}%
                  </span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="split">
        <div className="card card-pad stack">
          <div className="between">
            <div>
              <h2 id={alertsHeading}>{tx(locale, "أحدث التنبيهات", "Latest alerts")}</h2>
              <p className="note">{tx(locale, "عناصر تحتاج إجراء", "Items that need action")}</p>
            </div>
            <Link className="link" href="/alerts">{tx(locale, "الكل", "All")}</Link>
          </div>
          {data.alerts.length === 0 ? (
            <p className="empty">{tx(locale, "لا تنبيهات مفتوحة.", "No open alerts.")}</p>
          ) : (
            <DashList labelledBy={alertsHeading}>
              {data.alerts.map((alert) => (
                <DashListItem
                  key={alert.id}
                  href={`/operations/${alert.operationId}?department=${alert.departmentId}`}
                  title={`${locName(locale, alert.departmentAr, alert.departmentEn)} — ${locName(locale, alert.operationTypeAr, alert.operationTypeEn)}: ${locName(locale, alert.operationAr, alert.operationEn)}`}
                  meta={locName(locale, alert.stageAr, alert.stageEn)}
                  trailing={<em className="num">{alert.daysLate > 0 ? `+${alert.daysLate}` : formatDate(alert.plannedDue)}</em>}
                />
              ))}
            </DashList>
          )}
        </div>

        <div className="card card-pad stack">
          <h2 id={feedHeading}>{tx(locale, "العمليات الحديثة", "Recent activity")}</h2>
          <p className="note">{tx(locale, "آخر ما حدث", "What changed lately")}</p>
          {data.recentFeed.length === 0 ? (
            <p className="empty">{tx(locale, "لا أحداث حديثة.", "No recent activity.")}</p>
          ) : (
            <DashList labelledBy={feedHeading}>
              {data.recentFeed.map((item, index) => (
                <DashListItem
                  key={`${item.kind}-${item.href}-${index}`}
                  href={item.href}
                  title={locName(locale, item.titleAr, item.titleEn)}
                  meta={locName(locale, item.metaAr, item.metaEn)}
                  trailing={
                    <span className={`chip ${item.kind === "overdue" ? "overdue" : item.kind === "revision" ? "halfway" : "gold"}`}>
                      {item.kind === "overdue"
                        ? tx(locale, "متأخر", "Late")
                        : item.kind === "revision"
                          ? tx(locale, "تعديل", "Revision")
                          : tx(locale, "جديد", "New")}
                    </span>
                  }
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
            {data.departments.map((item) => {
              const face = sectorFacingStatus(item.status);
              return (
                <Link key={item.id} href={`/departments/${item.id}`} className="dept-cell">
                  <span className={`dot ${face === "overdue" ? "overdue" : face === "idle" ? "" : "on_track"}`} aria-hidden="true" />
                  <span>
                    <b>{locName(locale, item.nameAr, item.nameEn)}</b>
                    <small>
                      {item.operations === 0
                        ? tx(locale, "بدون عمليات", "No operations")
                        : face === "overdue"
                          ? tx(locale, "متأخرة", "Overdue")
                          : tx(locale, "في التنفيذ", "In execution")}
                      {item.overdueStages ? tx(locale, ` · ${item.overdueStages} متأخرة`, ` · ${item.overdueStages} overdue`) : ""}
                    </small>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
