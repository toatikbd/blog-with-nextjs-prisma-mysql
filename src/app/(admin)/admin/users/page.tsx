import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Users" };

const PAGE_SIZE = 25;

const TABS: { key: string; label: string; role?: Role }[] = [
  { key: "all", label: "All" },
  { key: "admin", label: "Admins", role: "ADMIN" },
  { key: "author", label: "Authors", role: "AUTHOR" },
  { key: "user", label: "Readers", role: "USER" },
];

type SearchParams = Record<string, string | string[] | undefined>;

// User management. ADMIN only.
export default function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-2 text-muted-foreground">Manage accounts and roles.</p>
        </div>
        <Link href="/admin/users/new" className={buttonVariants()}>
          <Plus /> New user
        </Link>
      </div>

      {/* Reads the session, the URL and the database, so it streams in at request time. */}
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-xl bg-card" />}>
        <UsersTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function listHref(params: { role?: string; q?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.role && params.role !== "all") search.set("role", params.role);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

const roleStyles: Record<Role, string> = {
  ADMIN: "bg-violet-100 text-violet-800",
  AUTHOR: "bg-sky-100 text-sky-800",
  USER: "bg-muted text-muted-foreground",
};

async function UsersTable({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const tab = TABS.find((t) => t.key === first(params.role)) ?? TABS[0];
  const q = (first(params.q) ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1);

  const searchWhere: Prisma.UserWhereInput = q
    ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] }
    : {};
  const where: Prisma.UserWhereInput = tab.role ? { ...searchWhere, role: tab.role } : searchWhere;

  const [users, total, grouped] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { posts: true, comments: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({ by: ["role"], where: searchWhere, _count: { _all: true } }),
  ]);

  const counts: Record<string, number> = { all: 0 };
  for (const row of grouped) {
    counts[row.role.toLowerCase()] = row._count._all;
    counts.all += row._count._all;
  }
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 text-sm" aria-label="Role">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={listHref({ role: t.key, q })}
              aria-current={t.key === tab.key ? "page" : undefined}
              className="rounded-md px-3 py-1 text-muted-foreground hover:text-foreground aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-sm"
            >
              {t.label} <span className="tabular-nums opacity-70">{counts[t.key] ?? 0}</span>
            </Link>
          ))}
        </nav>

        <form action="/admin/users" className="flex w-full gap-2 sm:w-auto" role="search">
          {tab.key !== "all" && <input type="hidden" name="role" value={tab.key} />}
          <Input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search name or email…"
            aria-label="Search users"
            className="sm:w-64"
          />
          <button type="submit" className={buttonVariants({ variant: "outline" })}>
            <Search /> <span className="sr-only">Search</span>
          </button>
        </form>
      </div>

      {users.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          {q ? "No users match your search." : "No users here."}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 text-right font-medium">Posts</th>
                <th className="px-4 py-3 text-right font-medium">Comments</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === admin.id;
                return (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {user.name ?? "—"}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleStyles[user.role]}`}
                      >
                        {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{user._count.posts}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{user._count.comments}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {dateFormat.format(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <Pencil /> Edit
                        </Link>
                        {!isSelf && (
                          <DeleteUserButton
                            id={user.id}
                            label={user.name ?? user.email}
                            postCount={user._count.posts}
                            commentCount={user._count.comments}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
          <span className="text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={listHref({ role: tab.key, q, page: page - 1 })}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Previous
              </Link>
            )}
            {page < pageCount && (
              <Link
                href={listHref({ role: tab.key, q, page: page + 1 })}
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

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
