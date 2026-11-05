import Link from "next/link";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { logout } from "@/actions/session";

export async function UserNav() {
  const session = await auth();

  if (!session?.user) {
    return (
      <>
        <Link href="/login" className="hover:text-foreground">
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/90"
        >
          Sign up
        </Link>
      </>
    );
  }

  return (
    <>
      {isStaff(session.user.role) && (
        <Link href="/admin" className="hover:text-foreground">
          Admin
        </Link>
      )}
      <span className="hidden text-foreground sm:inline">
        {session.user.name ?? session.user.email}
      </span>
      <form action={logout}>
        <button type="submit" className="hover:text-foreground">
          Log out
        </button>
      </form>
    </>
  );
}
