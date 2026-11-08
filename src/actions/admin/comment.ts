"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  commentEditSchema,
  commentReplySchema,
  commentStatusSchema,
} from "@/lib/validations/comment";

export type CommentFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  values?: { content?: string; status?: string };
};

function revalidateComments() {
  revalidatePath("/admin/comments");
  revalidatePath("/");
}

function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

/** Quick moderation from the list: approve, mark as spam or send back to pending. */
export async function setCommentStatus(id: string, status: string): Promise<void> {
  await requireAdmin();
  // Server actions can be called with any arguments, so check the status at runtime.
  const parsed = commentStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error("Invalid comment status");

  await prisma.comment.updateMany({ where: { id }, data: { status: parsed.data } });
  revalidateComments();
}

/** Bound to the comment id in the edit page: `updateComment.bind(null, id)`. */
export async function updateComment(
  id: string,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  await requireAdmin();

  const values = {
    content: String(formData.get("content") ?? ""),
    status: String(formData.get("status") ?? ""),
  };
  const parsed = commentEditSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  try {
    await prisma.comment.update({ where: { id }, data: parsed.data });
  } catch (error) {
    if (isNotFound(error)) return { error: "This comment no longer exists.", values };
    throw error;
  }

  revalidateComments();
  redirect("/admin/comments");
}

/** Posts an approved reply as the signed-in admin. Bound to the parent comment id. */
export async function replyToComment(
  parentId: string,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const admin = await requireAdmin();

  const values = { content: String(formData.get("content") ?? "") };
  const parsed = commentReplySchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const parent = await prisma.comment.findUnique({
    where: { id: parentId },
    select: { postId: true },
  });
  if (!parent) return { error: "This comment no longer exists.", values };

  await prisma.comment.create({
    data: {
      content: parsed.data.content,
      status: "APPROVED",
      postId: parent.postId,
      authorId: admin.id,
      parentId,
    },
  });

  revalidateComments();
  redirect("/admin/comments");
}

/** Replies to the comment are deleted with it (onDelete: Cascade). */
export async function deleteComment(id: string): Promise<void> {
  await requireAdmin();
  // deleteMany doesn't throw when the row is already gone.
  await prisma.comment.deleteMany({ where: { id } });
  revalidateComments();
}
