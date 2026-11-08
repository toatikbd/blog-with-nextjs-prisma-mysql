import type { CommentStatus } from "@/generated/prisma/enums";

const styles: Record<CommentStatus, string> = {
  APPROVED: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-800",
  SPAM: "bg-red-100 text-red-800",
};

export const commentStatusLabels: Record<CommentStatus, string> = {
  APPROVED: "Approved",
  PENDING: "Pending",
  SPAM: "Spam",
};

export function CommentStatusBadge({ status }: { status: CommentStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {commentStatusLabels[status]}
    </span>
  );
}
