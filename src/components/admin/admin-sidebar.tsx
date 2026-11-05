import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";

const navItems: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/categories", label: "Categories", adminOnly: true },
  { href: "/admin/tags", label: "Tags", adminOnly: true },
  { href: "/admin/comments", label: "Comments", adminOnly: true },
  { href: "/admin/users", label: "Users", adminOnly: true },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminSidebar({ role }: { role: Role }) {
  const items = navItems.filter((item) => !item.adminOnly || role === "ADMIN");

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-sidebar text-sidebar-foreground md:block">
      <div className="flex h-14 items-center border-b px-5 font-heading font-bold tracking-tight">
        Blog Admin
      </div>
      <nav className="flex flex-col gap-1 p-3 text-sm">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/"
          className="mt-4 rounded-md px-3 py-2 text-muted-foreground hover:bg-sidebar-accent"
        >
          ← View site
        </Link>
      </nav>
    </aside>
  );
}
