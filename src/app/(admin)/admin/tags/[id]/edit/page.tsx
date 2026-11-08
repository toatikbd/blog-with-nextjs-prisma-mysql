import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateTag } from "@/actions/admin/tag";
import { TagForm } from "@/components/admin/tag-form";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit tag" };

export default function EditTagPage({ params }: PageProps<"/admin/tags/[id]/edit">) {
  return (
    <div>
      <Link href="/admin/tags" className="text-sm text-muted-foreground hover:text-foreground">
        ← All tags
      </Link>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Edit tag</h1>

      <div className="mt-6">
        <Suspense fallback={<div className="h-56 max-w-xl animate-pulse rounded-xl bg-card" />}>
          <EditTagForm params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function EditTagForm({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const tag = await prisma.tag.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });
  if (!tag) notFound();

  return (
    <TagForm
      action={updateTag.bind(null, tag.id)}
      initial={{ name: tag.name, slug: tag.slug }}
      submitLabel="Save changes"
    />
  );
}
