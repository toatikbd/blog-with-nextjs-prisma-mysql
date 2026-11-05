import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { requireStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { PostStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Posts" };

// Post list. Authors see only their own posts; admins see every post.
export default function AdminPostsPage() {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="mt-2 text-muted-foreground">All posts, newest changes first.</p>
        </div>
        <Link href="/admin/posts/new" className={buttonVariants()}>
          <Plus /> New post
        </Link>
      </div>

      {/* The list reads the session and the database, so it streams in at request time. */}
      <Suspense fallback={<PostsTableSkeleton />}>
        <PostsTable />
      </Suspense>
    </div>
  );
}

async function PostsTable() {
  const user = await requireStaff("/admin/posts");

  const posts = await prisma.post.findMany({
    where: user.role === "ADMIN" ? undefined : { authorId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      views: true,
      updatedAt: true,
      author: { select: { name: true, email: true } },
      category: { select: { name: true } },
    },
  });

  if (posts.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
        No posts yet.
      </div>
    );
  }

  const showAuthor = user.role === "ADMIN";

  return (
    <div className="mt-6 overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {showAuthor && <th className="px-4 py-3 font-medium">Author</th>}
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 text-right font-medium">Views</th>
            <th className="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b last:border-0">
              <td className="px-4 py-3">
                <div className="font-medium">{post.title}</div>
                <div className="text-xs text-muted-foreground">/{post.slug}</div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={post.status} />
              </td>
              {showAuthor && <td className="px-4 py-3">{post.author.name ?? post.author.email}</td>}
              <td className="px-4 py-3 text-muted-foreground">{post.category?.name ?? "—"}</td>
              <td className="px-4 py-3 text-right tabular-nums">{post.views}</td>
              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                {dateFormat.format(post.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const statusStyles: Record<PostStatus, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-800",
  DRAFT: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function PostsTableSkeleton() {
  return <div className="mt-6 h-48 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10" />;
}
