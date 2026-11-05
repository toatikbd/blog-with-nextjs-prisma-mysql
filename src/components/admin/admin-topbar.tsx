import { logout } from "@/actions/session";
import type { CurrentUser } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

export function AdminTopbar({ user }: { user: CurrentUser }) {
  return (
    <header className="flex h-14 items-center justify-end gap-4 border-b bg-background px-6 text-sm">
      <span>
        {user.name ?? user.email}
        <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {user.role}
        </span>
      </span>
      <form action={logout}>
        <Button type="submit" variant="outline" size="sm">
          Log out
        </Button>
      </form>
    </header>
  );
}
