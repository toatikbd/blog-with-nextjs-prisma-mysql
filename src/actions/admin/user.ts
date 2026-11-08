"use server";

import bcrypt from "bcryptjs";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/permissions";
import { POSTS_TAG } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { userCreateSchema, userUpdateSchema } from "@/lib/validations/user";

export type UserFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  values?: { name?: string; email?: string; role?: string; bio?: string };
};

const EMAIL_TAKEN = { email: ["Another account already uses this email."] };

function isUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function revalidateUsers() {
  // Author names and bios appear on public posts.
  updateTag(POSTS_TAG);
  revalidatePath("/admin/users");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/comments");
}

export async function createUser(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  await requireAdmin();

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "USER"),
  };
  // Never send the password back to the browser.
  const values = { name: raw.name, email: raw.email, role: raw.role };

  const parsed = userCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { password, ...data } = parsed.data;

  try {
    await prisma.user.create({ data: { ...data, password: await bcrypt.hash(password, 12) } });
  } catch (error) {
    if (isUniqueError(error)) return { fieldErrors: EMAIL_TAKEN, values };
    throw error;
  }

  revalidateUsers();
  redirect("/admin/users");
}

/** Bound to the user id in the edit page: `updateUser.bind(null, id)`. */
export async function updateUser(
  id: string,
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const admin = await requireAdmin();

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { name: raw.name, email: raw.email, role: raw.role, bio: raw.bio };

  const parsed = userUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { password, bio, ...data } = parsed.data;

  // Keeps at least one admin: you can't demote yourself, and any other admin
  // you demote leaves you as an admin.
  if (id === admin.id && data.role !== "ADMIN") {
    return { fieldErrors: { role: ["You can't remove your own admin role."] }, values };
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        ...data,
        bio: bio || null,
        ...(password && { password: await bcrypt.hash(password, 12) }),
      },
    });
  } catch (error) {
    if (isUniqueError(error)) return { fieldErrors: EMAIL_TAKEN, values };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { error: "This user no longer exists.", values };
    }
    throw error;
  }

  revalidateUsers();
  redirect("/admin/users");
}

/** Deletes the account and, through onDelete: Cascade, its posts, comments and likes. */
export async function deleteUser(id: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  if (id === admin.id) return { error: "You can't delete your own account." };

  await prisma.user.deleteMany({ where: { id } });

  revalidateUsers();
  revalidatePath("/");
  return {};
}
