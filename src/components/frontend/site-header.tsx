import Link from "next/link";
import { Suspense } from "react";
import { UserNav } from "./user-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-lg font-bold tracking-tight">
          Blog
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          {/* Reads the session cookie, so it streams in after the static header. */}
          <Suspense fallback={<span className="h-5 w-12 animate-pulse rounded bg-muted" />}>
            <UserNav />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
