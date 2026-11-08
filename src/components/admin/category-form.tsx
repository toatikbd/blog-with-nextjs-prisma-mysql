"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { CategoryFormState } from "@/actions/admin/category";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { slugify } from "@/lib/slug";

type CategoryAction = (prev: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;

export function CategoryForm({
  action,
  initial,
  submitLabel,
}: {
  action: CategoryAction;
  initial?: { name: string; slug: string };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initial ?? {};
  const errors = state.fieldErrors ?? {};

  // The slug follows the name until it's edited by hand (or when editing an existing category).
  const [name, setName] = useState(values.name ?? "");
  const [slug, setSlug] = useState(values.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(values.slug));
  const shownSlug = slugEdited ? slug : slugify(name);

  return (
    <form
      action={formAction}
      className="grid max-w-xl gap-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10"
      noValidate
    >
      <FormField
        label="Name"
        name="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        errors={errors.name}
      />
      <FormField
        label="Slug"
        name="slug"
        placeholder="generated-from-the-name"
        value={shownSlug}
        onChange={(e) => {
          setSlugEdited(true);
          setSlug(e.target.value);
        }}
        errors={errors.slug}
      />

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link href="/admin/categories" className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
