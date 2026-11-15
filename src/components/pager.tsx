"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PAGE_SIZES, type PageSize } from "@/lib/paging";
import { SelectBox } from "@/components/select-box";
import { tx, type Locale } from "@/lib/text";

export function Pager({
  locale,
  page,
  pages,
  total,
  from,
  to,
  size,
  base,
  params,
}: {
  locale: Locale;
  page: number;
  pages: number;
  total: number;
  from: number;
  to: number;
  size: PageSize;
  base: string;
  params: Record<string, string | undefined>;
}) {
  const router = useRouter();
  function href(next: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    if (next > 1) query.set("page", String(next));
    const text = query.toString();
    return text ? `${base}?${text}` : base;
  }
  function chooseSize(next: string) {
    document.cookie = `operio-page-size=${next};path=/;max-age=31536000;samesite=lax`;
    const url = new URL(window.location.href);
    url.searchParams.delete("page");
    router.push(`${url.pathname}${url.search}`);
    router.refresh();
  }
  return (
    <div className="pager">
      <span>{total ? tx(locale, `${from}–${to} من ${total}`, `${from}–${to} of ${total}`) : tx(locale, "لا صفوف", "No rows")}</span>
      <div className="row">
        <label className="page-size">
          <span>{tx(locale, "عدد الصفوف", "Rows")}</span>
          <SelectBox compact value={String(size)} onChange={chooseSize} options={PAGE_SIZES.map((option) => ({ value: String(option), label: String(option) }))} />
        </label>
        {page > 1 ? <Link className="btn btn-ghost btn-sm" href={href(page - 1)}>{tx(locale, "السابق", "Previous")}</Link> : <span className="btn btn-ghost btn-sm" aria-disabled="true">{tx(locale, "السابق", "Previous")}</span>}
        <b className="num">{page} / {pages}</b>
        {page < pages ? <Link className="btn btn-ghost btn-sm" href={href(page + 1)}>{tx(locale, "التالي", "Next")}</Link> : <span className="btn btn-ghost btn-sm" aria-disabled="true">{tx(locale, "التالي", "Next")}</span>}
      </div>
    </div>
  );
}
