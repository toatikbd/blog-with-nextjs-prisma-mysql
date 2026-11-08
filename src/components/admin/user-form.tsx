"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { UserFormState } from "@/actions/admin/user";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import type { Role } from "@/generated/prisma/enums";

type UserAction = (prev: UserFormState, formData: FormData) => Promise<UserFormState>;

const controlClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm";

export const roleDescriptions: Record<Role, string> = {
  USER: "Reader: can comment and like posts.",
  AUTHOR: "Can write and publish their own posts.",
  ADMIN: "Full access to the admin panel.",
};

/**
 * Create form when `initial` is missing, edit form otherwise.
 * `hasPassword` is false for accounts that only sign in with GitHub.
 */
export function UserForm({
  action,
  initial,
  hasPassword = true,
  isSelf = false,
}: {
  action: UserAction;
  initial?: { name: string; email: string; role: Role; bio: string };
  hasPassword?: boolean;
  isSelf?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initial ?? {};
  const errors = state.fieldErrors ?? {};
  const editing = Boolean(initial);

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
        autoComplete="off"
        defaultValue={values.name}
        errors={errors.name}
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="off"
        defaultValue={values.email}
        errors={errors.email}
      />

      <div className="grid gap-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue={values.role ?? "USER"}
          aria-invalid={errors.role?.length ? true : undefined}
          className={`${controlClass} h-8`}
        >
          {(Object.keys(roleDescriptions) as Role[]).map((role) => (
            <option key={role} value={role} disabled={isSelf && role !== "ADMIN"}>
              {role.charAt(0) + role.slice(1).toLowerCase()} — {roleDescriptions[role]}
            </option>
          ))}
        </select>
        {errors.role?.length ? (
          <p className="text-sm text-destructive">{errors.role[0]}</p>
        ) : isSelf ? (
          <p className="text-xs text-muted-foreground">You can&apos;t change your own role.</p>
        ) : null}
      </div>

      {editing && (
        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={1000}
            defaultValue={values.bio}
            aria-invalid={errors.bio?.length ? true : undefined}
            className={`${controlClass} py-1.5`}
          />
          {errors.bio?.length ? <p className="text-sm text-destructive">{errors.bio[0]}</p> : null}
        </div>
      )}

      <div className="grid gap-1.5">
        <FormField
          label={editing ? "New password" : "Password"}
          name="password"
          type="password"
          required={!editing}
          autoComplete="new-password"
          errors={errors.password}
        />
        {editing && !errors.password?.length && (
          <p className="text-xs text-muted-foreground">
            {hasPassword
              ? "Leave empty to keep the current password."
              : "This account signs in with GitHub. Setting a password also allows email login."}
          </p>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Create user"}
        </Button>
        <Link href="/admin/users" className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
