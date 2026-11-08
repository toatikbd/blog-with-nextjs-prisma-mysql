"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTag } from "@/actions/admin/tag";
import { Button } from "@/components/ui/button";

export function DeleteTagButton({
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
      postCount > 0 ? `\n\n${postCount} post${postCount === 1 ? "" : "s"} will lose this tag.` : "";
    if (!window.confirm(`Delete the tag "${name}"?${warning}`)) return;
    startTransition(() => deleteTag(id));
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
