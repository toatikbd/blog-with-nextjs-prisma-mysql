import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/** Previous / next links. Page 1 is the bare path, later pages use `?page=N`. */
export function Pagination({
  basePath,
  page,
  pageCount,
}: {
  basePath: string;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const href = (n: number) => (n <= 1 ? basePath : `${basePath}?page=${n}`);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={buttonVariants({ variant: "outline" })}>
          ← Newer posts
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" className={buttonVariants({ variant: "outline" })}>
          Older posts →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

/** Reads `?page=` safely: anything invalid becomes 1. */
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10_000) : 1;
}
