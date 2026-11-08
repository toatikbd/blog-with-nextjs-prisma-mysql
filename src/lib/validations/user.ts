import { z } from "zod";

export const roleSchema = z.enum(["USER", "AUTHOR", "ADMIN"]);

const name = z.string().trim().min(2, "Name must be at least 2 characters").max(60);
const email = z.email("Enter a valid email address").trim().toLowerCase().max(191);
const password = z.string().min(8, "Password must be at least 8 characters").max(128);

export const userCreateSchema = z.object({ name, email, password, role: roleSchema });

export const userUpdateSchema = z.object({
  name,
  email,
  role: roleSchema,
  bio: z.string().trim().max(1000, "Bio can be at most 1000 characters"),
  // Empty keeps the current password.
  password: password.or(z.literal("")),
});
