"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { canEditPost, requireStaff } from "@/lib/permissions";
import { POSTS_TAG } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { htmlToText, readingTime, sanitizePostHtml, uniqueSlug } from "@/lib/post-content";
import { postSchema, type PostInput } from "@/lib/validations/post";

export type PostFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  values?: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    categoryId?: string;
    tagIds?: string[];
  };
};

const SLUG_TAKEN = { slug: ["This slug is already used by another post."] };

function isUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

type Prepared =
  | { ok: false; state: PostFormState }
  | {
      ok: true;
      data: PostInput;
      values: NonNullable<PostFormState["values"]>;
      content: string;
      text: string;
      publish: boolean;
      slug: string;
      categoryId: string | null;
      tagIds: string[];
    };

/** Validates the form and resolves the slug, category and tags. Shared by create and update. */
async function preparePost(formData: FormData, postId?: string): Promise<Prepared> {
  const raw = {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    content: String(formData.get("content") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    tagIds: formData.getAll("tagIds").map(String),
    intent: String(formData.get("intent") ?? "draft"),
  };
  const values = { ...raw, intent: undefined };

  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, state: { fieldErrors: z.flattenError(parsed.error).fieldErrors, values } };
  }
  const data = parsed.data;

  const content = sanitizePostHtml(data.content);
  const text = htmlToText(content);
  const publish = data.intent === "publish";
  if (publish && !text) {
    return {
      ok: false,
      state: { fieldErrors: { content: ["Write some content before publishing."] }, values },
    };
  }

  // A slug typed by the author must be free; a generated one gets a number suffix if needed.
  let slug: string;
  if (data.slug) {
    const taken = await prisma.post.findFirst({
      where: { slug: data.slug, ...(postId && { id: { not: postId } }) },
      select: { id: true },
    });
    if (taken) return { ok: false, state: { fieldErrors: SLUG_TAKEN, values } };
    slug = data.slug;
  } else {
    slug = await uniqueSlug(data.title, postId);
  }

  // Ignore category/tag ids that don't exist (e.g. deleted while the form was open).
  const [category, tags] = await Promise.all([
    data.categoryId
      ? prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } })
      : null,
    data.tagIds.length
      ? prisma.tag.findMany({ where: { id: { in: data.tagIds } }, select: { id: true } })
      : [],
  ]);

  return {
    ok: true,
    data,
    values,
    content,
    text,
    publish,
    slug,
    categoryId: category?.id ?? null,
    tagIds: tags.map((t) => t.id),
  };
}

function revalidatePosts() {
  // Public pages read cached data tagged POSTS_TAG.
  updateTag(POSTS_TAG);
  revalidatePath("/admin/posts");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/tags");
  revalidatePath("/");
}

export async function createPost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const user = await requireStaff("/admin/posts/new");

  const post = await preparePost(formData);
  if (!post.ok) return post.state;

  try {
    await prisma.post.create({
      data: {
        title: post.data.title,
        slug: post.slug,
        excerpt: post.data.excerpt || null,
        content: post.content,
        readingTime: readingTime(post.text),
        status: post.publish ? "PUBLISHED" : "DRAFT",
        publishedAt: post.publish ? new Date() : null,
        authorId: user.id,
        categoryId: post.categoryId,
        tags: { create: post.tagIds.map((tagId) => ({ tagId })) },
      },
    });
  } catch (error) {
    // Another post took the same slug between our check and the insert.
    if (isUniqueError(error)) return { fieldErrors: SLUG_TAKEN, values: post.values };
    throw error;
  }

  revalidatePosts();
  redirect("/admin/posts");
}

/** Bound to the post id in the edit page: `updatePost.bind(null, id)`. */
export async function updatePost(
  id: string,
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const user = await requireStaff(`/admin/posts/${id}/edit`);

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true, publishedAt: true },
  });
  if (!existing) return { error: "This post no longer exists." };
  if (!canEditPost(user, existing)) return { error: "You can only edit your own posts." };

  const post = await preparePost(formData, id);
  if (!post.ok) return post.state;

  try {
    await prisma.post.update({
      where: { id },
      data: {
        title: post.data.title,
        slug: post.slug,
        excerpt: post.data.excerpt || null,
        content: post.content,
        readingTime: readingTime(post.text),
        status: post.publish ? "PUBLISHED" : "DRAFT",
        // Keep the first publish date so re-publishing doesn't move the post to the top.
        publishedAt: post.publish ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        categoryId: post.categoryId,
        tags: { deleteMany: {}, create: post.tagIds.map((tagId) => ({ tagId })) },
      },
    });
  } catch (error) {
    if (isUniqueError(error)) return { fieldErrors: SLUG_TAKEN, values: post.values };
    throw error;
  }

  revalidatePosts();
  redirect("/admin/posts");
}

/** Deletes a post with its comments, likes and tag links (onDelete: Cascade). */
export async function deletePost(id: string): Promise<{ error?: string }> {
  const user = await requireStaff("/admin/posts");

  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) return {}; // already gone
  if (!canEditPost(user, post)) return { error: "You can only delete your own posts." };

  // deleteMany doesn't throw if someone else deleted it a moment ago.
  await prisma.post.deleteMany({ where: { id } });

  revalidatePosts();
  return {};
}
