import type { Metadata } from "next";

export const metadata: Metadata = { title: "Overview" };

// Admin overview. Stats cards are added in week 7.
export default function AdminOverviewPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-2 text-muted-foreground">Stats and recent activity will appear here.</p>
    </div>
  );
}
