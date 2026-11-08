import { z } from "zod";

export const commentStatusSchema = z.enum(["PENDING", "APPROVED", "SPAM"]);

export const commentContentSchema = z
  .string()
  .trim()
  .min(1, "Write something first")
  .max(5000, "Comments can be at most 5000 characters");

export const commentEditSchema = z.object({
  content: commentContentSchema,
  status: commentStatusSchema,
});

export const commentReplySchema = z.object({ content: commentContentSchema });
