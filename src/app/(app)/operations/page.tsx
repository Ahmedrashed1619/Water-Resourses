import Link from "next/link";
import { CreateOperationModal } from "@/components/create-operation-modal";
import { Pager } from "@/components/pager";
import { SelectBox } from "@/components/select-box";
import { PageHeader, StatusChip } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { statusLabel } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { getLocale } from "@/lib/locale";
import { getPageSize } from "@/lib/page-size";
import { pageOf } from "@/lib/paging";
import { can, isDepartmentRole } from "@/lib/permissions";
import { filterOptions, listDirectory, listOperations, listTypes } from "@/lib/queries";
import { locName, tx } from "@/lib/text";

export default async function OperationsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; department?: string; status?: string; new?: string; page?: string }> }) {
  const user = await requireUser();
  const locale = await getLocale();
  const query = await searchParams;
  const manage = can(user, "operations.manage");
  const [items, options, types, departments] = await Promise.all([
    listOperations(user, { q: query.q, typeId: query.type, departmentId: query.department, status: query.status }),
    filterOptions(),
    manage ? listTypes() : Promise.resolve([]),
    manage ? listDirectory() : Promise.resolve([]),
  ]);
  const statuses = ["overdue", "due_soon", "halfway", "on_track", "pending", "completed"] as const;
  const size = await getPageSize();
  const view = pageOf(items, query.page, size);
  return (
    <>
      <PageHeader kicker={tx(locale, "التعاقدات", "Contracts")} title={tx(locale, "العمليات", "Operations")} lede={tx(locale, "كل عملية لها نوع وتاريخ موافقة فنية، ويمكن أن تخدم أكثر من إدارة.", "Each operation has a type and a technical approval date, and can serve more than one department.")}>
        {manage ? (
          <CreateOperationModal
            startOpen={query.new === "1"}
            types={types.filter((type) => type.isActive).map((type) => ({
              id: type.id,
              code: type.code,
              nameAr: type.nameAr,
              nameEn: type.nameEn,
              stages: type.stages.filter((stage) => stage.isActive).map((stage) => ({
                code: stage.code,
                nameAr: stage.nameAr,
                nameEn: stage.nameEn,
                sortOrder: stage.sortOrder,
                durationMonths: stage.durationMonths,
                durationDays: stage.durationDays,
                anchor: stage.anchor,
              })),
            }))}
            departments={departments.map((department) => ({ id: department.id, code: department.code, nameAr: department.nameAr, nameEn: department.nameEn }))}
          />
        ) : null}
      </PageHeader>
      <form className="filters" action="/operations">
        <label className="field"><span>{tx(locale, "بحث", "Search")}</span><input className="input" name="q" defaultValue={query.q ?? ""} /></label>
        <label className="field">
          <span>{tx(locale, "النوع", "Type")}</span>
          <SelectBox name="type" defaultValue={query.type ?? ""} options={[{ value: "", label: tx(locale, "الكل", "All") }, ...options.types.map((type) => ({ value: type.id, label: locName(locale, type.nameAr, type.nameEn) }))]} />
        </label>
        {!isDepartmentRole(user.role) ? (
          <label className="field">
            <span>{tx(locale, "الإدارة", "Department")}</span>
            <SelectBox name="department" defaultValue={query.department ?? ""} options={[{ value: "", label: tx(locale, "الكل", "All") }, ...options.departments.map((department) => ({ value: department.id, label: locName(locale, department.nameAr, department.nameEn) }))]} />
          </label>
        ) : null}
        <label className="field">
          <span>{tx(locale, "الحالة", "Status")}</span>
          <SelectBox name="status" defaultValue={query.status ?? ""} options={[{ value: "", label: tx(locale, "الكل", "All") }, ...statuses.map((status) => ({ value: status, label: statusLabel(locale, status) }))]} />
        </label>
        <button className="btn btn-primary" type="submit">{tx(locale, "تصفية", "Filter")}</button>
      </form>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{tx(locale, "العملية", "Operation")}</th>
              <th>{tx(locale, "النوع", "Type")}</th>
              <th>{tx(locale, "الموافقة", "Approval")}</th>
              <th>{tx(locale, "الإدارات", "Departments")}</th>
              <th>{tx(locale, "الاعتماد الحالي", "Current amount")}</th>
              <th>{tx(locale, "الحالة", "Status")}</th>
            </tr>
          </thead>
          <tbody>
            {view.total === 0 ? <tr><td colSpan={6} className="empty">{tx(locale, "لا عمليات مطابقة.", "No matching operations.")}</td></tr> : view.rows.map((item) => (
              <tr key={item.id}>
                <td><Link className="link" href={`/operations/${item.id}`}>{locName(locale, item.nameAr, item.nameEn)}</Link></td>
                <td>{locName(locale, item.typeAr, item.typeEn)}</td>
                <td className="num">{formatDate(item.approvalDate)}</td>
                <td>{item.departmentCount}<div className="fine">{locName(locale, item.departmentsAr, item.departmentsEn)}</div></td>
                <td className="num">{formatMoney(item.amount, locale)}</td>
                <td><StatusChip locale={locale} status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager locale={locale} page={view.page} pages={view.pages} total={view.total} from={view.from} to={view.to} size={view.size} base="/operations" params={{ q: query.q, type: query.type, department: query.department, status: query.status }} />
    </>
  );
}
