import { notFound } from "next/navigation";
import { OperationWorkspace } from "@/components/operation-workspace";
import { requireUser } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { can, isDepartmentRole } from "@/lib/permissions";
import { getOperation, listDirectory } from "@/lib/queries";

export default async function OperationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ department?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const operation = await getOperation(user, id, query.department);
  if (!operation) notFound();
  const directory = can(user, "operations.manage") ? await listDirectory() : [];
  return (
    <OperationWorkspace
      operation={operation}
      directory={directory.map((item) => ({ id: item.id, nameAr: item.nameAr, nameEn: item.nameEn }))}
      canManage={can(user, "operations.manage")}
      canExecuteStages={can(user, "stages.execute") || can(user, "operations.manage")}
      canEditDates={can(user, "dates.edit") || can(user, "operations.manage")}
      isDepartment={isDepartmentRole(user.role)}
      today={todayISO()}
      scopedDepartmentId={query.department ?? null}
    />
  );
}
