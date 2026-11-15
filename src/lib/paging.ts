export const PAGE_SIZES = [5, 10, 20] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const PAGE_SIZE_COOKIE = "operio-page-size";

export function normalizePageSize(raw: string | undefined | null): PageSize {
  const value = Number(raw);
  return (PAGE_SIZES as readonly number[]).includes(value) ? (value as PageSize) : 5;
}

export function pageOf<T>(items: T[], raw: string | undefined, size: number) {
  const pageSize = normalizePageSize(String(size));
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const requested = Number(raw);
  const page = Math.min(pages, Math.max(1, Number.isFinite(requested) ? requested : 1));
  const start = (page - 1) * pageSize;
  return { page, pages, total: items.length, from: items.length ? start + 1 : 0, to: Math.min(items.length, start + pageSize), rows: items.slice(start, start + pageSize), size: pageSize };
}
