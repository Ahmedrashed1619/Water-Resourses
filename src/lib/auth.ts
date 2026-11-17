import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Department, User } from "@prisma/client";
import { SESSION_COOKIE } from "./constants";
import { verifySession } from "./jwt";
import { prisma } from "./prisma";

export type CurrentUser = User & { department: Department | null };

/** One DB lookup per request tree (layout + page + nested). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const session = await verifySession(token);
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      include: { department: true },
    });
    if (!user?.isActive || user.deletedAt) return null;
    return user;
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
