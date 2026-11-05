"use server";

// Shared by the frontend and the admin panel.
import { signOut } from "@/lib/auth";

export async function logout() {
  await signOut({ redirectTo: "/" });
}
