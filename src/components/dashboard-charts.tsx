"use client";

import { BarChart, DonutChart, StackChart } from "@/components/charts";
import { useI18n } from "@/i18n/context";
import type { ChartBar, ChartSlice } from "@/lib/view";

export function DashboardCharts({
  status,
  types,
  alerts,
  departments,
}: {
  status: ChartSlice[];
  types: ChartSlice[];
  alerts: ChartSlice[];
  departments: ChartBar[];
}) {
  const { locale, t } = useI18n();
  const empty = t("لا توجد بيانات كافية للرسم.", "Not enough data to chart yet.");
  const labelSlice = (slice: ChartSlice) => (locale === "ar" ? slice.labelAr : slice.labelEn);
  const labelBar = (row: ChartBar) => (locale === "ar" ? row.labelAr : row.labelEn);

  return (
    <section className="chart-grid" aria-label={t("رسوم المتابعة", "Follow-up charts")}>
      <DonutChart
        title={t("حالة العمليات", "Operation status")}
        description={t("مرّر أو استخدم لوحة المفاتيح لاستكشاف كل حالة. اضغط للتثبيت.", "Hover or use the keyboard to explore each status. Click to pin.")}
        empty={empty}
        slices={status}
        labelOf={labelSlice}
        centerCaption={t("الإجمالي", "Total")}
      />
      <DonutChart
        title={t("توزيع التنبيهات", "Alert mix")}
        description={t("نسبة كل نوع تنبيه من الإجمالي المفتوح.", "Share of each open alert type.")}
        empty={empty}
        slices={alerts}
        labelOf={labelSlice}
        centerCaption={t("تنبيهات", "Alerts")}
      />
      <StackChart
        title={t("أنواع العمليات", "Operation types")}
        description={t("شريط تفاعلي لأنواع التعاقدات النشطة.", "Interactive strip of active contract types.")}
        empty={empty}
        slices={types}
        labelOf={labelSlice}
        hintIdle={t("مرّر على مقطع لإظهار التفاصيل", "Hover a segment for details")}
      />
      <BarChart
        title={t("أنشط الإدارات", "Most active departments")}
        description={t("مقارنة عدد العمليات مع المراحل المتأخرة.", "Compare operation count with overdue stages.")}
        empty={empty}
        rows={departments}
        labelOf={labelBar}
        primaryLabel={t("عمليات", "Ops")}
        secondaryLabel={t("متأخر", "Late")}
      />
    </section>
  );
}
