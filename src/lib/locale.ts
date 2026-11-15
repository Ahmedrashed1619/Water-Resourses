import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./constants";
import type { Locale } from "./text";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  return jar.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ar";
}
