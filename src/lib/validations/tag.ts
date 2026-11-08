import { z } from "zod";

export const tagSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  // Optional: generated from the name when left empty.
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only")
    .or(z.literal("")),
});

export type TagInput = z.infer<typeof tagSchema>;
