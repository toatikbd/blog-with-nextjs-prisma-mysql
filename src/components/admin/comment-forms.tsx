"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { CommentFormState } from "@/actions/admin/comment";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { CommentStatus } from "@/generated/prisma/enums";

type CommentAction = (prev: CommentFormState, formData: FormData) => Promise<CommentFormState>;

const controlClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm";

/** Edit a comment's text and status. */
export function CommentEditForm({
  action,
  initial,
}: {
  action: CommentAction;
  initial: { content: string; status: CommentStatus };
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initial;
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <ContentField
        id="edit-content"
        label="Comment"
        defaultValue={values.content}
        errors={errors.content}
      />
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={values.status}
          className={`${controlClass} h-8 py-0 md:w-48`}
        >
          <option value="APPROVED">Approved</option>
          <option value="PENDING">Pending</option>
          <option value="SPAM">Spam</option>
        </select>
        {errors.status?.length ? (
          <p className="text-sm text-destructive">{errors.status[0]}</p>
        ) : null}
      </div>

      <FormError message={state.error} />

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Link href="/admin/comments" className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

/** Reply to a comment as the signed-in admin (published right away). */
export function CommentReplyForm({ action }: { action: CommentAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <ContentField
        id="reply-content"
        label="Your reply"
        defaultValue={state.values?.content}
        errors={errors.content}
      />
      <FormError message={state.error} />
      <div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Posting…" : "Post reply"}
        </Button>
      </div>
    </form>
  );
}

function ContentField({
  id,
  label,
  defaultValue,
  errors,
}: {
  id: string;
  label: string;
  defaultValue?: string;
  errors?: string[];
}) {
  const hasError = Boolean(errors?.length);
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        name="content"
        rows={5}
        maxLength={5000}
        required
        defaultValue={defaultValue}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={controlClass}
      />
      {hasError && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {errors![0]}
        </p>
      )}
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
