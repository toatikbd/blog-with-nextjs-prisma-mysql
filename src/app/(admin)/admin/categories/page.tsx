import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DeleteCategoryButton } from "@/components/admin/delete-category-button";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Categories" };

// Category list. ADMIN only.
export default function AdminCategoriesPage() {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-2 text-muted-foreground">Group posts by topic.</p>
        </div>
        <Link href="/admin/categories/new" className={buttonVariants()}>
          <Plus /> New category
        </Link>
      </div>

      {/* Reads the session and the database, so it streams in at request time. */}
      <Suspense fallback={<TableSkeleton />}>
        <CategoriesTable />
      </Suspense>
    </div>
  );
}

async function CategoriesTable() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, _count: { select: { posts: true } } },
  });

  if (categories.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
        No categories yet.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 text-right font-medium">Posts</th>
            <th className="px-4 py-3 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{category.name}</td>
              <td className="px-4 py-3 text-muted-foreground">/{category.slug}</td>
              <td className="px-4 py-3 text-right tabular-nums">{category._count.posts}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Pencil /> Edit
                  </Link>
                  <DeleteCategoryButton
                    id={category.id}
                    name={category.name}
                    postCount={category._count.posts}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableSkeleton() {
  return <div className="mt-6 h-48 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10" />;
}
