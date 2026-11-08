import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground">
        <p>Built with Next.js, Prisma, and MySQL.</p>
        <nav aria-label="Footer" className="flex gap-6">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
