import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Search } from "lucide-react";
import { CommentActions } from "@/components/admin/comment-actions";
import { CommentStatusBadge } from "@/components/admin/comment-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Prisma } from "@/generated/prisma/client";
import type { CommentStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Comments" };

const PAGE_SIZE = 25;

const TABS: { key: string; label: string; status?: CommentStatus }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending", status: "PENDING" },
  { key: "approved", label: "Approved", status: "APPROVED" },
  { key: "spam", label: "Spam", status: "SPAM" },
];

type SearchParams = Record<string, string | string[] | undefined>;

// Comment moderation. ADMIN only.
export default function AdminCommentsPage({ searchParams }: PageProps<"/admin/comments">) {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Comments</h1>
      <p className="mt-2 text-muted-foreground">
        Approve, edit, reply to or remove comments. Only approved comments are shown on the site.
      </p>

      {/* Reads the session, the URL and the database, so it streams in at request time. */}
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-xl bg-card" />}>
        <CommentsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function listHref(params: { status?: string; q?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/admin/comments?${query}` : "/admin/comments";
}

async function CommentsList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;

  const tab = TABS.find((t) => t.key === first(params.status)) ?? TABS[0];
  const q = (first(params.q) ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1);

  const searchWhere: Prisma.CommentWhereInput = q ? { content: { contains: q } } : {};
  const where: Prisma.CommentWhereInput = tab.status
    ? { ...searchWhere, status: tab.status }
    : searchWhere;

  const [comments, total, grouped] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        content: true,
        status: true,
        createdAt: true,
        author: { select: { name: true, email: true } },
        post: { select: { title: true, slug: true } },
        parent: { select: { author: { select: { name: true, email: true } } } },
        _count: { select: { replies: true } },
      },
    }),
    prisma.comment.count({ where }),
    prisma.comment.groupBy({ by: ["status"], where: searchWhere, _count: { _all: true } }),
  ]);

  const counts: Record<string, number> = { all: 0 };
  for (const row of grouped) {
    counts[row.status.toLowerCase()] = row._count._all;
    counts.all += row._count._all;
  }
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 text-sm" aria-label="Status">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={listHref({ status: t.key, q })}
              aria-current={t.key === tab.key ? "page" : undefined}
              className="rounded-md px-3 py-1 text-muted-foreground hover:text-foreground aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-sm"
            >
              {t.label} <span className="tabular-nums opacity-70">{counts[t.key] ?? 0}</span>
            </Link>
          ))}
        </nav>

        <form action="/admin/comments" className="flex w-full gap-2 sm:w-auto" role="search">
          {tab.key !== "all" && <input type="hidden" name="status" value={tab.key} />}
          <Input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search comments…"
            aria-label="Search comments"
            className="sm:w-64"
          />
          <button type="submit" className={buttonVariants({ variant: "outline" })}>
            <Search /> <span className="sr-only">Search</span>
          </button>
        </form>
      </div>

      {comments.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          {q ? "No comments match your search." : "No comments here."}
        </div>
      ) : (
        <ul className="mt-6 divide-y rounded-xl bg-card ring-1 ring-foreground/10">
          {comments.map((comment) => (
            <li key={comment.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-medium">{comment.author.name ?? comment.author.email}</span>
                  <CommentStatusBadge status={comment.status} />
                  <span className="text-muted-foreground">
                    {dateFormat.format(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  On <span className="text-foreground">{comment.post.title}</span>
                  {comment.parent &&
                    ` · reply to ${comment.parent.author.name ?? comment.parent.author.email}`}
                  {comment._count.replies > 0 &&
                    ` · ${comment._count.replies} repl${comment._count.replies === 1 ? "y" : "ies"}`}
                </p>
                <p className="mt-2 line-clamp-3 text-sm break-words whitespace-pre-line">
                  {comment.content}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2 md:justify-end">
                <Link
                  href={`/admin/comments/${comment.id}/edit`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Pencil /> Edit / reply
                </Link>
                <CommentActions
                  id={comment.id}
                  status={comment.status}
                  replyCount={comment._count.replies}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
          <span className="text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={listHref({ status: tab.key, q, page: page - 1 })}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Previous
              </Link>
            )}
            {page < pageCount && (
              <Link
                href={listHref({ status: tab.key, q, page: page + 1 })}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
