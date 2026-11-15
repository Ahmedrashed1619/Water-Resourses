import { redirect } from "next/navigation";
import { Pager } from "@/components/pager";
import { Tip } from "@/components/tip";
import { UserCreateForm } from "@/components/user-create-form";
import { UserDetailButton } from "@/components/user-detail";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { roleHint, roleLabel, statusHint } from "@/lib/labels";
import { getLocale } from "@/lib/locale";
import { getPageSize } from "@/lib/page-size";
import { pageOf } from "@/lib/paging";
import { can, creatableRoles, grantsOf, isDepartmentRole, parseTasks, rankOf } from "@/lib/permissions";
import { listDirectory, listUsers } from "@/lib/queries";
import { locName, tx } from "@/lib/text";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  if (!can(user, "users.manage")) redirect("/");
  const locale = await getLocale();
  const query = await searchParams;
  const size = await getPageSize();
  const [users, departments] = await Promise.all([listUsers(user), listDirectory()]);
  const view = pageOf(users, query.page, size);
  return (
    <>
      <PageHeader kicker={tx(locale, "الحسابات", "Accounts")} title={tx(locale, "المستخدمون", "Users")} lede={tx(locale, "ترى حسابات جهتك فقط. أيقونة البطاقة تفتح الدور والحالة والمهام، والمسؤول الأعلى يعدّلها من النافذة نفسها.", "You only see accounts in your own organization. The card icon opens the role, status, and tasks. A super admin edits them from that same window.")}>
        <UserCreateForm
          roles={creatableRoles(user).map((role) => ({ value: role, label: roleLabel(locale, role) }))}
          departments={departments.map((item) => ({ id: item.id, nameAr: item.nameAr, nameEn: item.nameEn }))}
          lockDepartmentId={isDepartmentRole(user.role) ? user.departmentId : null}
        />
      </PageHeader>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{tx(locale, "الاسم", "Name")}</th>
              <th>{tx(locale, "الدور", "Role")}</th>
              <th>{tx(locale, "الجهة", "Organization")}</th>
              <th>{tx(locale, "الحالة", "Status")}</th>
              <th>{tx(locale, "إجراءات", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map((account) => {
              const tasks = grantsOf(account);
              const manageable = account.id !== user.id && (isDepartmentRole(user.role)
                ? account.departmentId === user.departmentId && (rankOf(user.role) === "SUPER_ADMIN" || rankOf(account.role) === "EMPLOYEE")
                : !isDepartmentRole(account.role) && (can(user, "users.manageAll") || rankOf(account.role) === "EMPLOYEE"));
              return (
              <tr key={account.id}>
                <td>{locName(locale, account.nameAr, account.nameEn)}<div className="fine">{account.email}</div></td>
                <td>
                  <Tip text={roleHint(locale, account.role)}>
                    <span className={isDepartmentRole(account.role) ? "chip halfway" : "chip gold"}>{roleLabel(locale, account.role)}</span>
                  </Tip>
                </td>
                <td>{account.department ? locName(locale, account.department.nameAr, account.department.nameEn) : tx(locale, "القطاع", "Sector")}</td>
                <td>
                  <Tip text={statusHint(locale, account.isActive ? "active" : "inactive")}>
                    <span className={account.isActive ? "chip on_track" : "chip overdue"}>{account.isActive ? tx(locale, "نشط", "Active") : tx(locale, "موقوف", "Inactive")}</span>
                  </Tip>
                </td>
                <td>
                  <UserDetailButton
                    userId={account.id}
                    name={locName(locale, account.nameAr, account.nameEn)}
                    email={account.email}
                    roleText={roleLabel(locale, account.role)}
                    roleHint={roleHint(locale, account.role)}
                    roleClass={isDepartmentRole(account.role) ? "chip halfway" : "chip gold"}
                    organization={account.department ? locName(locale, account.department.nameAr, account.department.nameEn) : tx(locale, "القطاع", "Sector")}
                    statusText={account.isActive ? tx(locale, "نشط", "Active") : tx(locale, "موقوف", "Inactive")}
                    statusHint={statusHint(locale, account.isActive ? "active" : "inactive")}
                    statusClass={account.isActive ? "chip on_track" : "chip overdue"}
                    tasks={tasks}
                    custom={Boolean(parseTasks(account.tasks))}
                    canApplyRole={rankOf(user.role) === "SUPER_ADMIN"}
                    manageable={manageable}
                    active={account.isActive}
                  />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pager locale={locale} page={view.page} pages={view.pages} total={view.total} from={view.from} to={view.to} size={view.size} base="/users" params={{}} />
    </>
  );
}
