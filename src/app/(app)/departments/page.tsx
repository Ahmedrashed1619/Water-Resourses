import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { can } from "@/lib/permissions";
import { getDashboard } from "@/lib/queries";
import { locName, tx } from "@/lib/text";

export default async function DepartmentsPage() {
  const user = await requireUser();
  if (!can(user, "departments.view")) redirect("/");
  const locale = await getLocale();
  const data = await getDashboard(user);
  return (
    <>
      <PageHeader kicker={tx(locale, "33 إدارة", "33 departments")} title={tx(locale, "الإدارات", "Departments")} lede={tx(locale, "كل إدارة ترى عملياتها فقط. القطاع يرى الصورة كاملة.", "Each department sees only its own operations. The Sector sees the whole picture.")} />
      <div className="dept-board">
        {data.departments.map((item) => (
          <Link key={item.id} href={`/departments/${item.id}`} className="dept-cell">
            <span className={`dot ${item.status}`} />
            <span>
              <b>{locName(locale, item.nameAr, item.nameEn)}</b>
              <small>{item.operations === 0 ? tx(locale, "بدون عمليات", "No operations") : tx(locale, `${item.operations === 1 ? "عملية واحدة" : `${item.operations} عمليات`} · ${item.overdueStages} مراحل متأخرة`, `${item.operations} operations · ${item.overdueStages} overdue stages`)}</small>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
