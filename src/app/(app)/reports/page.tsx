import { redirect } from "next/navigation";
import { ReportStudio } from "@/components/report-studio";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { can } from "@/lib/permissions";
import { listAlerts } from "@/lib/queries";
import { tx } from "@/lib/text";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ departmentId?: string; stage?: string }> }) {
  const user = await requireUser();
  if (!can(user, "reports.export")) redirect("/");
  const locale = await getLocale();
  const query = await searchParams;
  const rows = await listAlerts(user, { departmentId: query.departmentId, stageCode: query.stage });
  const search = `?departmentId=${query.departmentId ?? ""}&stage=${query.stage ?? ""}`;
  return (
    <>
      <PageHeader kicker={tx(locale, "تصدير", "Export")} title={tx(locale, "تقرير تنبيهات التجاوز", "Overdue alert report")} lede={tx(locale, "نفس الصفوف تُنزَّل كجدول بيانات، ومستند تفصيلي، وصورة.", "The same rows download as a spreadsheet, a detailed document, and an image.")} />
      <ReportStudio rows={rows} query={search} />
    </>
  );
}
