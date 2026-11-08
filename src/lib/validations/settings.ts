import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.email("Enter a valid email address").trim().toLowerCase().max(191),
  bio: z.string().trim().max(1000, "Bio can be at most 1000 characters"),
});

export const passwordSchema = z
  .object({
    // Empty is allowed only for accounts without a password (GitHub sign-in); the action checks.
    currentPassword: z.string().max(128),
    newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
