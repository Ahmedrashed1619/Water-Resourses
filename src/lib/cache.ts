import "server-only";

import { revalidatePath } from "next/cache";

/** Path refresh after mutations (no data cache / tags). */
const PATHS = [
  "/",
  "/operations",
  "/alerts",
  "/revisions",
  "/users",
  "/settings",
  "/departments",
  "/needs",
  "/finance",
  "/audit",
  "/reports",
] as const;

export function bust(..._ignored: string[]) {
  for (const path of PATHS) revalidatePath(path);
}
