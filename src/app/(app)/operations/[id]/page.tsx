import { notFound } from "next/navigation";
import { OperationWorkspace } from "@/components/operation-workspace";
import { requireUser } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { can, isDepartmentRole } from "@/lib/permissions";
import { getOperation, listDirectory } from "@/lib/queries";

export default async function OperationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const operation = await getOperation(user, id);
  if (!operation) notFound();
  const directory = can(user, "operations.manage") ? await listDirectory() : [];
  return (
    <OperationWorkspace
      operation={operation}
      directory={directory.map((item) => ({ id: item.id, nameAr: item.nameAr, nameEn: item.nameEn }))}
      canManage={can(user, "operations.manage")}
      isDepartment={isDepartmentRole(user.role)}
      today={todayISO()}
    />
  );
}
