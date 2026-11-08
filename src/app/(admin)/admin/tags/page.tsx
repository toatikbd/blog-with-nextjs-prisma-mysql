import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DeleteTagButton } from "@/components/admin/delete-tag-button";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Tags" };

// Tag list. ADMIN only.
export default function AdminTagsPage() {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Tags</h1>
          <p className="mt-2 text-muted-foreground">
            Label posts with keywords. A post can have up to 10 tags.
          </p>
        </div>
        <Link href="/admin/tags/new" className={buttonVariants()}>
          <Plus /> New tag
        </Link>
      </div>

      {/* Reads the session and the database, so it streams in at request time. */}
      <Suspense fallback={<TableSkeleton />}>
        <TagsTable />
      </Suspense>
    </div>
  );
}

async function TagsTable() {
  await requireAdmin();

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, _count: { select: { posts: true } } },
  });

  if (tags.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
        No tags yet.
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
          {tags.map((tag) => (
            <tr key={tag.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{tag.name}</td>
              <td className="px-4 py-3 text-muted-foreground">/{tag.slug}</td>
              <td className="px-4 py-3 text-right tabular-nums">{tag._count.posts}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/tags/${tag.id}/edit`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Pencil /> Edit
                  </Link>
                  <DeleteTagButton id={tag.id} name={tag.name} postCount={tag._count.posts} />
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
