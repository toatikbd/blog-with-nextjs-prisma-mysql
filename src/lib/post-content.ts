import "server-only";
import sanitizeHtml from "sanitize-html";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

/**
 * Cleans editor HTML before it is stored. The editor only produces these tags,
 * but the server can't trust what the browser sends, so anything else
 * (scripts, event handlers, javascript: links) is removed here.
 */
export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "h2",
      "h3",
      "h4",
      "strong",
      "em",
      "u",
      "s",
      "code",
      "pre",
      "blockquote",
      "ul",
      "ol",
      "li",
      "hr",
      "a",
    ],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }),
    },
  });
}

/** Plain text of an HTML string, used for reading time and empty checks. */
export function htmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}

/** Minutes to read at ~200 words per minute, at least 1. */
export function readingTime(text: string): number {
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 200));
}

/** Returns `base`, or `base-2`, `base-3`, … if the slug is already taken. */
export async function uniqueSlug(input: string): Promise<string> {
  const base = slugify(input) || "post";
  const taken = await prisma.post.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  const used = new Set(taken.map((p) => p.slug));
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
