import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createTag } from "@/actions/admin/tag";
import { TagForm } from "@/components/admin/tag-form";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "New tag" };

export default function NewTagPage() {
  return (
    <div>
      <Link href="/admin/tags" className="text-sm text-muted-foreground hover:text-foreground">
        ← All tags
      </Link>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">New tag</h1>

      <div className="mt-6">
        <Suspense fallback={<div className="h-56 max-w-xl animate-pulse rounded-xl bg-card" />}>
          <NewTagForm />
        </Suspense>
      </div>
    </div>
  );
}

async function NewTagForm() {
  await requireAdmin();
  return <TagForm action={createTag} submitLabel="Create tag" />;
}
