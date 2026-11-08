"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/actions/admin/post";
import { Button } from "@/components/ui/button";

export function DeletePostButton({
  id,
  title,
  commentCount,
}: {
  id: string;
  title: string;
  commentCount: number;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    const comments =
      commentCount > 0 ? ` and its ${commentCount} comment${commentCount === 1 ? "" : "s"}` : "";
    if (!window.confirm(`Delete "${title}"${comments}?\n\nThis can't be undone.`)) return;

    startTransition(async () => {
      const result = await deletePost(id);
      if (result.error) window.alert(result.error);
    });
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={onClick}
      disabled={pending}
      aria-label={`Delete ${title}`}
    >
      <Trash2 /> {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
