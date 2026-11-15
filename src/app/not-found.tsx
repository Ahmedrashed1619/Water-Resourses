import Link from "next/link";
import { dict } from "@/i18n/dictionaries";
import { getLocale } from "@/lib/locale";
import { tx } from "@/lib/text";

export default async function NotFound() {
  const locale = await getLocale();
  const d = dict(locale);
  return (
    <main className="page">
      <div className="card card-pad stack">
        <p className="kicker">{d.appName}</p>
        <h1>{tx(locale, "الصفحة غير موجودة", "This page was not found")}</h1>
        <Link className="btn btn-primary" href="/">{tx(locale, "العودة للمتابعة", "Back to follow-up")}</Link>
      </div>
    </main>
  );
}
