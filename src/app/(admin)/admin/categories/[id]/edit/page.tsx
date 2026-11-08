import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateCategory } from "@/actions/admin/category";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit category" };

export default function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]/edit">) {
  return (
    <div>
      <Link
        href="/admin/categories"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← All categories
      </Link>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Edit category</h1>

      <div className="mt-6">
        <Suspense fallback={<div className="h-56 max-w-xl animate-pulse rounded-xl bg-card" />}>
          <EditCategoryForm params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function EditCategoryForm({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });
  if (!category) notFound();

  return (
    <CategoryForm
      action={updateCategory.bind(null, category.id)}
      initial={{ name: category.name, slug: category.slug }}
      submitLabel="Save changes"
    />
  );
}
