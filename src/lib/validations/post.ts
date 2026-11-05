import { z } from "zod";

export const postSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(191),
  // Optional: generated from the title when left empty.
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only")
    .or(z.literal("")),
  excerpt: z.string().trim().max(300, "Excerpt can be at most 300 characters"),
  content: z.string().max(2_000_000, "Content is too long"),
  categoryId: z.string().trim(),
  tagIds: z.array(z.string()).max(10, "Choose at most 10 tags"),
  intent: z.enum(["draft", "publish"]),
});

export type PostInput = z.infer<typeof postSchema>;
