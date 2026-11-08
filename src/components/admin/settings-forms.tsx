"use client";

import { useActionState } from "react";
import { changePassword, updateProfile, type SettingsFormState } from "@/actions/admin/settings";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; bio: string };
}) {
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(updateProfile, {});
  const values = state.values ?? initial;
  const errors = state.fieldErrors ?? {};
  const bioError = errors.bio?.length ? errors.bio[0] : undefined;

  return (
    // The key resets the uncontrolled inputs to the saved values after each save.
    <form key={JSON.stringify(values)} action={action} className="grid gap-5" noValidate>
      <FormField
        label="Name"
        name="name"
        required
        autoComplete="name"
        defaultValue={values.name}
        errors={errors.name}
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        defaultValue={values.email}
        errors={errors.email}
      />
      <div className="grid gap-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          maxLength={1000}
          defaultValue={values.bio}
          aria-invalid={bioError ? true : undefined}
          aria-describedby="bio-hint"
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
        />
        <p
          id="bio-hint"
          className={bioError ? "text-sm text-destructive" : "text-xs text-muted-foreground"}
        >
          {bioError ?? "Shown on your author profile."}
        </p>
      </div>

      <FormStatus state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(changePassword, {});
  const errors = state.fieldErrors ?? {};

  return (
    // React resets the form after each submit, so passwords never stay in the fields.
    <form action={action} className="grid gap-5" noValidate>
      {hasPassword ? (
        <FormField
          label="Current password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          errors={errors.currentPassword}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          You sign in with GitHub. Set a password to also log in with your email.
        </p>
      )}
      <FormField
        label="New password"
        name="newPassword"
        type="password"
        required
        autoComplete="new-password"
        errors={errors.newPassword}
      />
      <FormField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        required
        autoComplete="new-password"
        errors={errors.confirmPassword}
      />

      <FormStatus state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : hasPassword ? "Change password" : "Set password"}
        </Button>
      </div>
    </form>
  );
}

function FormStatus({ state }: { state: SettingsFormState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
        {state.success}
      </p>
    );
  }
  return null;
}
