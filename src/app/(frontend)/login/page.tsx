import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { githubEnabled } from "@/lib/auth";
import { LoginForm } from "@/components/frontend/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <section className="mx-auto flex w-full max-w-sm flex-col px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Log in</CardTitle>
          <CardDescription>Welcome back. Enter your email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* The form reads ?callbackUrl= from the URL, which needs a Suspense boundary. */}
          <Suspense>
            <LoginForm githubEnabled={githubEnabled} />
          </Suspense>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account yet?{" "}
            <Link href="/register" className="font-medium text-foreground underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
