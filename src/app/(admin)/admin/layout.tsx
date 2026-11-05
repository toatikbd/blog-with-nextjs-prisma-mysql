import type { Metadata } from "next";
import { Suspense } from "react";
import { requireStaff } from "@/lib/permissions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

// Layout for the admin panel: sidebar + top bar + content.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    // Checking the session reads cookies, which must happen inside Suspense.
    <Suspense fallback={<div className="min-h-screen bg-muted/40" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  // Second layer of protection (after proxy.ts): role loaded fresh from the database.
  const user = await requireStaff();

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AdminSidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar user={user} />
        <div className="flex-1 p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
