import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PostForm } from "@/components/admin/post-form";
import { requireStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "New post" };

export default function NewPostPage() {
  return (
    <div>
      <Link href="/admin/posts" className="text-sm text-muted-foreground hover:text-foreground">
        ← All posts
      </Link>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">New post</h1>

      <div className="mt-6">
        {/* Reads the session and the database, so it streams in at request time. */}
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-card" />}>
          <NewPostForm />
        </Suspense>
      </div>
    </div>
  );
}

async function NewPostForm() {
  await requireStaff("/admin/posts/new");

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return <PostForm categories={categories} tags={tags} />;
}
