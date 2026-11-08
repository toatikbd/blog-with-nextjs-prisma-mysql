"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCategory } from "@/actions/admin/category";
import { Button } from "@/components/ui/button";

export function DeleteCategoryButton({
  id,
  name,
  postCount,
}: {
  id: string;
  name: string;
  postCount: number;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    const warning =
      postCount > 0
        ? `\n\n${postCount} post${postCount === 1 ? "" : "s"} will be left without a category.`
        : "";
    if (!window.confirm(`Delete the category "${name}"?${warning}`)) return;
    startTransition(() => deleteCategory(id));
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={onClick}
      disabled={pending}
      aria-label={`Delete ${name}`}
    >
      <Trash2 /> {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
