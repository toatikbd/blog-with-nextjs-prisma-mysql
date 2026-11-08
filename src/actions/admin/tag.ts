"use server";

// Aliased: this file exports its own `updateTag` action (edit a blog tag).
import { revalidatePath, updateTag as expireCacheTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/permissions";
import { POSTS_TAG } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { tagSchema } from "@/lib/validations/tag";

export type TagFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  values?: { name?: string; slug?: string };
};

function readForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
  };
}

/** Maps a unique-constraint violation to the field that caused it. */
function uniqueError(error: unknown): TagFormState["fieldErrors"] | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return null;
  }
  const target = JSON.stringify(error.meta ?? {});
  if (target.includes("name")) return { name: ["A tag with this name already exists."] };
  return { slug: ["This slug is already used by another tag."] };
}

function revalidateTags() {
  // Tag names appear on public post pages.
  expireCacheTag(POSTS_TAG);
  revalidatePath("/admin/tags");
  revalidatePath("/admin/posts");
  revalidatePath("/");
}

export async function createTag(_prev: TagFormState, formData: FormData): Promise<TagFormState> {
  await requireAdmin();

  const values = readForm(formData);
  const parsed = tagSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const slug = parsed.data.slug || slugify(parsed.data.name);
  if (!slug) return { fieldErrors: { slug: ["Enter a slug."] }, values };

  try {
    await prisma.tag.create({ data: { name: parsed.data.name, slug } });
  } catch (error) {
    const fieldErrors = uniqueError(error);
    if (fieldErrors) return { fieldErrors, values };
    throw error;
  }

  revalidateTags();
  redirect("/admin/tags");
}

/** Bound to the tag id in the edit page: `updateTag.bind(null, id)`. */
export async function updateTag(
  id: string,
  _prev: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  await requireAdmin();

  const values = readForm(formData);
  const parsed = tagSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const slug = parsed.data.slug || slugify(parsed.data.name);
  if (!slug) return { fieldErrors: { slug: ["Enter a slug."] }, values };

  try {
    await prisma.tag.update({ where: { id }, data: { name: parsed.data.name, slug } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { error: "This tag no longer exists.", values };
    }
    const fieldErrors = uniqueError(error);
    if (fieldErrors) return { fieldErrors, values };
    throw error;
  }

  revalidateTags();
  redirect("/admin/tags");
}

/** Deleting a tag only removes its links to posts (PostTag rows cascade); the posts stay. */
export async function deleteTag(id: string): Promise<void> {
  await requireAdmin();

  // deleteMany doesn't throw when the row is already gone.
  await prisma.tag.deleteMany({ where: { id } });

  revalidateTags();
}
