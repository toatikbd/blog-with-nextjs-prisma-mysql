"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUser } from "@/actions/admin/user";
import { Button } from "@/components/ui/button";

export function DeleteUserButton({
  id,
  label,
  postCount,
  commentCount,
}: {
  id: string;
  label: string;
  postCount: number;
  commentCount: number;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    const lost = [
      postCount > 0 && `${postCount} post${postCount === 1 ? "" : "s"}`,
      commentCount > 0 && `${commentCount} comment${commentCount === 1 ? "" : "s"}`,
    ].filter(Boolean);
    const warning = lost.length
      ? `\n\nTheir ${lost.join(" and ")} will be deleted too. This can't be undone.`
      : "\n\nThis can't be undone.";
    if (!window.confirm(`Delete the account "${label}"?${warning}`)) return;

    startTransition(async () => {
      const result = await deleteUser(id);
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
      aria-label={`Delete ${label}`}
    >
      <Trash2 /> {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
