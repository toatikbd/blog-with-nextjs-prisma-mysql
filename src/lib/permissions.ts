import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

const STAFF_ROLES: Role[] = ["AUTHOR", "ADMIN"];

/**
 * Returns the signed-in user, loaded fresh from the database, so role changes
 * and deleted accounts take effect right away (the session cookie may be older).
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, role: true },
  });
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For admin pages and actions: AUTHOR or ADMIN. Redirects to /login otherwise. */
export async function requireStaff(callbackUrl = "/admin"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (!STAFF_ROLES.includes(user.role)) redirect("/");
  return user;
}

/** For ADMIN-only pages and actions (users, categories, tags, comment moderation). */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireStaff();
  // Authors who open an admin-only page are sent back to the admin overview.
  if (user.role !== "ADMIN") redirect("/admin");
  return user;
}

export function isStaff(role: Role | undefined) {
  return role !== undefined && STAFF_ROLES.includes(role);
}

/** Authors can edit their own posts; admins can edit any post. */
export function canEditPost(user: Pick<CurrentUser, "id" | "role">, post: { authorId: string }) {
  return user.role === "ADMIN" || post.authorId === user.id;
}
