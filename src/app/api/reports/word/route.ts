import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { can } from "@/lib/permissions";
import { listAlerts } from "@/lib/queries";
import { buildAlertsDocument } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!can(user, "reports.export") && !can(user, "reports.overrun")) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const url = new URL(request.url);
  const rows = await listAlerts(user, {
    departmentId: url.searchParams.get("departmentId") || undefined,
    stageCode: url.searchParams.get("stage") || undefined,
  });
  const locale = await getLocale();
  const body = await buildAlertsDocument(rows, locale);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=operio-alerts.docx",
    },
  });
}
