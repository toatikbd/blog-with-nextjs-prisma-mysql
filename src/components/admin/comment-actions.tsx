"use client";

import { useTransition } from "react";
import { Check, ShieldAlert, Trash2 } from "lucide-react";
import { deleteComment, setCommentStatus } from "@/actions/admin/comment";
import { Button } from "@/components/ui/button";
import type { CommentStatus } from "@/generated/prisma/enums";

/** Approve / spam / delete buttons for one comment. */
export function CommentActions({
  id,
  status,
  replyCount,
}: {
  id: string;
  status: CommentStatus;
  replyCount: number;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    const warning =
      replyCount > 0
        ? `\n\nIts ${replyCount} repl${replyCount === 1 ? "y" : "ies"} will be deleted too.`
        : "";
    if (!window.confirm(`Delete this comment?${warning}`)) return;
    startTransition(() => deleteComment(id));
  }

  return (
    <>
      {status !== "APPROVED" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => setCommentStatus(id, "APPROVED"))}
        >
          <Check /> Approve
        </Button>
      )}
      {status !== "SPAM" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => setCommentStatus(id, "SPAM"))}
        >
          <ShieldAlert /> Spam
        </Button>
      )}
      <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={onDelete}>
        <Trash2 /> Delete
      </Button>
    </>
  );
}
