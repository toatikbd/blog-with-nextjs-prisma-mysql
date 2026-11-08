"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { updateSession } from "@/lib/auth";
import { requireStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { passwordSchema, profileSchema } from "@/lib/validations/settings";

export type SettingsFormState = {
  success?: string;
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  values?: { name?: string; email?: string; bio?: string };
};

/** Updates the signed-in user's own name, email and bio. */
export async function updateProfile(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireStaff("/admin/settings");

  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { bio, ...data } = parsed.data;

  try {
    await prisma.user.update({ where: { id: user.id }, data: { ...data, bio: bio || null } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { email: ["Another account already uses this email."] }, values };
    }
    throw error;
  }

  // The site header reads the name from the session cookie, so refresh it.
  await updateSession({});
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  return { success: "Profile saved.", values: { ...data, bio } };
}

/** Changes the signed-in user's password. Requires the current one if it exists. */
export async function changePassword(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireStaff("/admin/settings");

  const parsed = passwordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { currentPassword, newPassword } = parsed.data;

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });
  if (account?.password) {
    const ok = currentPassword && (await bcrypt.compare(currentPassword, account.password));
    if (!ok) return { fieldErrors: { currentPassword: ["Current password is incorrect."] } };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(newPassword, 12) },
  });

  return { success: account?.password ? "Password changed." : "Password set." };
}
