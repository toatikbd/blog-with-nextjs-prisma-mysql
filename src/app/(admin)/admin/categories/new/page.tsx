import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createCategory } from "@/actions/admin/category";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <div>
      <Link
        href="/admin/categories"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← All categories
      </Link>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">New category</h1>

      <div className="mt-6">
        <Suspense fallback={<div className="h-56 max-w-xl animate-pulse rounded-xl bg-card" />}>
          <NewCategoryForm />
        </Suspense>
      </div>
    </div>
  );
}

async function NewCategoryForm() {
  await requireAdmin();
  return <CategoryForm action={createCategory} submitLabel="Create category" />;
}
