import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function NotFoundMessage({ title, text }: { title: string; text: string }) {
  return (
    <section className="mx-auto w-full max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted-foreground">{text}</p>
      <Link href="/" className={`${buttonVariants()} mt-8`}>
        Back to the blog
      </Link>
    </section>
  );
}
