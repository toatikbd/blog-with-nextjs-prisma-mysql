"use client";

import { useActionState } from "react";
import { register, type AuthFormState } from "@/actions/frontend/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(register, {});

  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormField
        label="Name"
        name="name"
        autoComplete="name"
        required
        defaultValue={state.values?.name}
        errors={state.fieldErrors?.name}
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        errors={state.fieldErrors?.password}
      />
      <FormField
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
