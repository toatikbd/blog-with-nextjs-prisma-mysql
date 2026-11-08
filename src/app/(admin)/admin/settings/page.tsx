import type { Metadata } from "next";
import { Suspense } from "react";
import { PasswordForm, ProfileForm } from "@/components/admin/settings-forms";
import { requireStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Settings" };

// The signed-in user's own profile and password. Open to authors and admins.
export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-muted-foreground">Your profile and sign-in details.</p>

      {/* Reads the session and the database, so it streams in at request time. */}
      <Suspense fallback={<div className="mt-6 h-[36rem] animate-pulse rounded-xl bg-card" />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  const current = await requireStaff("/admin/settings");
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: current.id },
    select: { name: true, email: true, bio: true, role: true, password: true, createdAt: true },
  });

  return (
    <div className="mt-6 grid gap-6">
      <Section title="Profile" description="Your name and bio appear on the posts you write.">
        <ProfileForm initial={{ name: user.name ?? "", email: user.email, bio: user.bio ?? "" }} />
      </Section>

      <Section
        title="Password"
        description="Use at least 8 characters. You stay signed in after changing it."
      >
        <PasswordForm hasPassword={Boolean(user.password)} />
      </Section>

      <Section title="Account">
        <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">Role</dt>
          <dd>{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</dd>
          <dt className="text-muted-foreground">Member since</dt>
          <dd>{dateFormat.format(user.createdAt)}</dd>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">Only an admin can change roles.</p>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-base font-medium">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });
