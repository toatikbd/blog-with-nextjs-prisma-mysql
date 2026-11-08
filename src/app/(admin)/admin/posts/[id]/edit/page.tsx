import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { updatePost } from "@/actions/admin/post";
import { PostForm } from "@/components/admin/post-form";
import { canEditPost, requireStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit post" };

export default function EditPostPage({ params }: PageProps<"/admin/posts/[id]/edit">) {
  return (
    <div>
      <Link href="/admin/posts" className="text-sm text-muted-foreground hover:text-foreground">
        ← All posts
      </Link>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Edit post</h1>

      <div className="mt-6">
        {/* Reads the session, the URL and the database, so it streams in at request time. */}
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-card" />}>
          <EditPostForm params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function EditPostForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff(`/admin/posts/${id}/edit`);

  const [post, categories, tags] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        status: true,
        authorId: true,
        categoryId: true,
        tags: { select: { tagId: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!post) notFound();
  // Authors can only open their own posts.
  if (!canEditPost(user, post)) redirect("/admin/posts");

  return (
    // The key gives each post a fresh form, so its fields never keep another post's values.
    <PostForm
      key={post.id}
      action={updatePost.bind(null, post.id)}
      categories={categories}
      tags={tags}
      status={post.status}
      initial={{
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        content: post.content,
        categoryId: post.categoryId ?? "",
        tagIds: post.tags.map((t) => t.tagId),
      }}
    />
  );
}
