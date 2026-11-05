"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { htmlToText, readingTime, sanitizePostHtml, uniqueSlug } from "@/lib/post-content";
import { postSchema } from "@/lib/validations/post";

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

export async function createPost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const user = await requireStaff("/admin/posts/new");

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
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const data = parsed.data;

  const content = sanitizePostHtml(data.content);
  const text = htmlToText(content);
  const publish = data.intent === "publish";
  if (publish && !text) {
    return { fieldErrors: { content: ["Write some content before publishing."] }, values };
  }

  // A slug typed by the author must be free; a generated one gets a number suffix if needed.
  let slug: string;
  if (data.slug) {
    const taken = await prisma.post.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (taken)
      return { fieldErrors: { slug: ["This slug is already used by another post."] }, values };
    slug = data.slug;
  } else {
    slug = await uniqueSlug(data.title);
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

  try {
    await prisma.post.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt || null,
        content,
        readingTime: readingTime(text),
        status: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? new Date() : null,
        authorId: user.id,
        categoryId: category?.id ?? null,
        tags: { create: tags.map((t) => ({ tagId: t.id })) },
      },
    });
  } catch (error) {
    // Another post took the same slug between our check and the insert.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { slug: ["This slug is already used by another post."] }, values };
    }
    throw error;
  }

  revalidatePath("/admin/posts");
  if (publish) revalidatePath("/");
  redirect("/admin/posts");
}
