import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { replyToComment, updateComment } from "@/actions/admin/comment";
import { CommentEditForm, CommentReplyForm } from "@/components/admin/comment-forms";
import { CommentStatusBadge } from "@/components/admin/comment-status-badge";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit comment" };

export default function EditCommentPage({ params }: PageProps<"/admin/comments/[id]/edit">) {
  return (
    <div className="max-w-3xl">
      <Link href="/admin/comments" className="text-sm text-muted-foreground hover:text-foreground">
        ← All comments
      </Link>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Edit comment</h1>

      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-xl bg-card" />}>
        <EditComment params={params} />
      </Suspense>
    </div>
  );
}

async function EditComment({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: {
      id: true,
      content: true,
      status: true,
      createdAt: true,
      author: { select: { name: true, email: true } },
      post: { select: { title: true } },
      parent: { select: { content: true, author: { select: { name: true, email: true } } } },
    },
  });
  if (!comment) notFound();

  return (
    <div className="mt-6 grid gap-6">
      <section className="rounded-xl bg-card p-5 text-sm ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{comment.author.name ?? comment.author.email}</span>
          <CommentStatusBadge status={comment.status} />
          <span className="text-muted-foreground">{dateFormat.format(comment.createdAt)}</span>
        </div>
        <p className="mt-1 text-muted-foreground">
          On <span className="text-foreground">{comment.post.title}</span>
        </p>
        {comment.parent && (
          <blockquote className="mt-3 border-l-2 pl-3 text-muted-foreground">
            <span className="font-medium text-foreground">
              In reply to {comment.parent.author.name ?? comment.parent.author.email}:
            </span>{" "}
            <span className="line-clamp-3 whitespace-pre-line">{comment.parent.content}</span>
          </blockquote>
        )}
      </section>

      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <CommentEditForm
          action={updateComment.bind(null, comment.id)}
          initial={{ content: comment.content, status: comment.status }}
        />
      </section>

      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-base font-medium">Reply</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Your reply is posted as you and approved right away.
        </p>
        <CommentReplyForm action={replyToComment.bind(null, comment.id)} />
      </section>
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
