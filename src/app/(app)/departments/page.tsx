import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { can, isDepartmentRole, sectorFacingStatus } from "@/lib/permissions";
import { getDashboard } from "@/lib/queries";
import { locName, tx } from "@/lib/text";

export default async function DepartmentsPage() {
  const user = await requireUser();
  if (isDepartmentRole(user.role)) {
    if (user.departmentId) redirect(`/departments/${user.departmentId}`);
    redirect("/");
  }
  if (!can(user, "departments.view")) redirect("/");
  const locale = await getLocale();
  const data = await getDashboard(user);
  return (
    <>
      <PageHeader
        kicker={tx(locale, "33 إدارة", "33 departments")}
        title={tx(locale, "الإدارات", "Departments")}
        lede={tx(locale, "كل إدارة ترى عملياتها فقط. القطاع يرى الصورة كاملة بحالتي التنفيذ أو التأخر.", "Each department sees only its own operations. The Sector sees in-execution or overdue only.")}
      />
      <div className="dept-board">
        {data.departments.map((item) => {
          const face = sectorFacingStatus(item.status);
          return (
            <Link key={item.id} href={`/departments/${item.id}`} className="dept-cell">
              <span className={`dot ${face === "overdue" ? "overdue" : face === "idle" ? "" : "on_track"}`} />
              <span>
                <b>{locName(locale, item.nameAr, item.nameEn)}</b>
                <small>
                  {item.operations === 0
                    ? tx(locale, "بدون عمليات", "No operations")
                    : face === "overdue"
                      ? tx(locale, "متأخرة", "Overdue")
                      : tx(locale, "في التنفيذ", "In execution")}
                  {item.overdueStages ? tx(locale, ` · ${item.overdueStages} مراحل متأخرة`, ` · ${item.overdueStages} overdue stages`) : ""}
                </small>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
