import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { formatLongDate } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import { getShellCounts } from "@/lib/queries";
import { syncAlerts } from "@/lib/services";
import { locName } from "@/lib/text";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  await syncAlerts();
  const [counts, locale] = await Promise.all([getShellCounts(user), getLocale()]);
  return (
    <Shell
      role={user.role}
      tasks={user.tasks}
      name={locName(locale, user.nameAr, user.nameEn)}
      email={user.email}
      department={user.department ? locName(locale, user.department.nameAr, user.department.nameEn) : null}
      counts={counts}
      today={formatLongDate(todayISO(), locale)}
    >
      {children}
    </Shell>
  );
}
