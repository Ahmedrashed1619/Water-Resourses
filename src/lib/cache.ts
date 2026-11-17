import "server-only";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { cache } from "react";

/** Shared tag names for data domains. Invalidate on writes. */
export const tags = {
  shell: "shell",
  dashboard: "dashboard",
  operations: "operations",
  alerts: "alerts",
  revisions: "revisions",
  users: "users",
  types: "types",
  departments: "departments",
  needs: "needs",
  finance: "finance",
  audit: "audit",
  directory: "directory",
} as const;

export type CacheTag = (typeof tags)[keyof typeof tags];

/** Deduplicate work within a single RSC/request tree. */
export const memo = cache;

/**
 * Cache a read across navigations for a short TTL.
 * Include any user/scope keys inside `keyParts` so tenants never share data.
 */
export function cachedQuery<T>(
  keyParts: string[],
  tagList: CacheTag[],
  fn: () => Promise<T>,
  revalidateSeconds = 30,
) {
  return unstable_cache(fn, keyParts, {
    tags: tagList,
    revalidate: revalidateSeconds,
  })();
}

const PATH_BY_TAG: Record<CacheTag, string[]> = {
  shell: ["/"],
  dashboard: ["/"],
  operations: ["/operations", "/"],
  alerts: ["/alerts", "/"],
  revisions: ["/revisions", "/"],
  users: ["/users"],
  types: ["/settings"],
  departments: ["/departments", "/operations"],
  needs: ["/needs", "/"],
  finance: ["/finance", "/"],
  audit: ["/audit"],
  directory: ["/operations", "/users", "/departments", "/needs"],
};

/** Invalidate tags + related paths after a mutation. */
export function bust(...list: CacheTag[]) {
  const paths = new Set<string>();
  for (const tag of list) {
    revalidateTag(tag);
    for (const path of PATH_BY_TAG[tag] ?? []) paths.add(path);
  }
  for (const path of paths) revalidatePath(path);
}
