"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { categorySchema } from "@/lib/validations/category";

export type CategoryFormState = {
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
function uniqueError(error: unknown): CategoryFormState["fieldErrors"] | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return null;
  }
  const target = JSON.stringify(error.meta ?? {});
  if (target.includes("name")) return { name: ["A category with this name already exists."] };
  return { slug: ["This slug is already used by another category."] };
}

function revalidateCategories() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/posts");
  revalidatePath("/");
}

export async function createCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const values = readForm(formData);
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const slug = parsed.data.slug || slugify(parsed.data.name);
  if (!slug) return { fieldErrors: { slug: ["Enter a slug."] }, values };

  try {
    await prisma.category.create({ data: { name: parsed.data.name, slug } });
  } catch (error) {
    const fieldErrors = uniqueError(error);
    if (fieldErrors) return { fieldErrors, values };
    throw error;
  }

  revalidateCategories();
  redirect("/admin/categories");
}

/** Bound to the category id in the edit page: `updateCategory.bind(null, id)`. */
export async function updateCategory(
  id: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const values = readForm(formData);
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const slug = parsed.data.slug || slugify(parsed.data.name);
  if (!slug) return { fieldErrors: { slug: ["Enter a slug."] }, values };

  try {
    await prisma.category.update({ where: { id }, data: { name: parsed.data.name, slug } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { error: "This category no longer exists.", values };
    }
    const fieldErrors = uniqueError(error);
    if (fieldErrors) return { fieldErrors, values };
    throw error;
  }

  revalidateCategories();
  redirect("/admin/categories");
}

/** Posts in a deleted category keep existing with no category (onDelete: SetNull). */
export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();

  // deleteMany doesn't throw when the row is already gone.
  await prisma.category.deleteMany({ where: { id } });

  revalidateCategories();
}
