import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default async function NewOperationPage() {
  const user = await requireUser();
  if (!can(user, "operations.manage")) redirect("/operations");
  redirect("/operations?new=1");
}
