import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { can } from "@/lib/permissions";
import { listOperationExportRows } from "@/lib/queries";
import { buildOperationsWorkbook } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!can(user, "reports.export") && !can(user, "reports.print") && !can(user, "reports.overrun")) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const url = new URL(request.url);
  const overdueOnly = url.searchParams.get("overdue") === "1";
  if (overdueOnly && !can(user, "reports.overrun") && !can(user, "reports.export")) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const filter = {
    q: url.searchParams.get("q") || undefined,
    typeId: url.searchParams.get("type") || undefined,
    departmentId: url.searchParams.get("department") || undefined,
    status: overdueOnly ? "overdue" : url.searchParams.get("status") || undefined,
  };
  const rows = await listOperationExportRows(user, filter);
  const locale = await getLocale();
  const title =
    locale === "ar"
      ? overdueOnly
        ? "تقرير التجاوز — العمليات المتأخرة"
        : "تقرير العمليات حسب الإدارة"
      : overdueOnly
        ? "Overrun report — overdue operations"
        : "Operations by department report";
  const body = await buildOperationsWorkbook(rows, locale, title);
  const filename = overdueOnly ? "operio-overrun.xlsx" : "operio-operations.xlsx";
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  });
}
