import "server-only";
import { cookies } from "next/headers";
import { normalizePageSize, PAGE_SIZE_COOKIE } from "./paging";

export async function getPageSize() {
  return normalizePageSize((await cookies()).get(PAGE_SIZE_COOKIE)?.value);
}
