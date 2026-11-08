import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createUser } from "@/actions/admin/user";
import { UserForm } from "@/components/admin/user-form";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "New user" };

export default function NewUserPage() {
  return (
    <div>
      <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
        ← All users
      </Link>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">New user</h1>

      <div className="mt-6">
        <Suspense fallback={<div className="h-96 max-w-xl animate-pulse rounded-xl bg-card" />}>
          <NewUserForm />
        </Suspense>
      </div>
    </div>
  );
}

async function NewUserForm() {
  await requireAdmin();
  return <UserForm action={createUser} />;
}
