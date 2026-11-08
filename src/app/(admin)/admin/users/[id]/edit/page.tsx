import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateUser } from "@/actions/admin/user";
import { UserForm } from "@/components/admin/user-form";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit user" };

export default function EditUserPage({ params }: PageProps<"/admin/users/[id]/edit">) {
  return (
    <div>
      <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
        ← All users
      </Link>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Edit user</h1>

      <div className="mt-6">
        <Suspense fallback={<div className="h-96 max-w-xl animate-pulse rounded-xl bg-card" />}>
          <EditUserForm params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function EditUserForm({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, bio: true, password: true },
  });
  if (!user) notFound();

  return (
    <UserForm
      action={updateUser.bind(null, user.id)}
      initial={{ name: user.name ?? "", email: user.email, role: user.role, bio: user.bio ?? "" }}
      hasPassword={Boolean(user.password)}
      isSelf={user.id === admin.id}
    />
  );
}
