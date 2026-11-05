"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login, loginWithGitHub, type AuthFormState } from "@/actions/frontend/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

export function LoginForm({ githubEnabled }: { githubEnabled: boolean }) {
  const callbackUrl = useSearchParams().get("callbackUrl") ?? "/";
  const [state, action, pending] = useActionState<AuthFormState, FormData>(login, {});

  return (
    <div className="grid gap-6">
      <form action={action} className="grid gap-4" noValidate>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
          autoComplete="current-password"
          required
          errors={state.fieldErrors?.password}
        />
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      {githubEnabled && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <form action={loginWithGitHub}>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <Button type="submit" variant="outline" className="w-full">
              Continue with GitHub
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
