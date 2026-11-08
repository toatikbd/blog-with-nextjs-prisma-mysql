import Link from "next/link";
import { getActiveCategories } from "@/lib/posts";

/** "All" plus every category that has published posts. Cached, so it's part of the static shell. */
export async function CategoryBar({ active }: { active?: string }) {
  const categories = await getActiveCategories();
  if (categories.length === 0) return null;

  const items = [
    { name: "All", href: "/", slug: undefined },
    ...categories.map((c) => ({
      name: c.name,
      href: `/category/${c.slug}`,
      slug: c.slug,
    })),
  ];

  return (
    <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-2 text-sm whitespace-nowrap">
        {items.map((item) => {
          const current = item.slug === active;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className="inline-flex rounded-full border px-3 py-1 text-muted-foreground hover:border-foreground/30 hover:text-foreground aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background"
              >
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
