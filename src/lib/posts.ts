import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { sanitizePostHtml } from "@/lib/post-content";
import { prisma } from "@/lib/prisma";

/**
 * Cached reads for the public site. Every function is tagged "posts", and the
 * admin Server Actions call `updateTag(POSTS_TAG)` after any change to posts,
 * categories, tags or authors, so readers see edits right away.
 */
export const POSTS_TAG = "posts";
export const POSTS_PER_PAGE = 9;

const PUBLISHED = { status: "PUBLISHED" } satisfies Prisma.PostWhereInput;

const cardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  readingTime: true,
  publishedAt: true,
  author: { select: { id: true, name: true } },
  category: { select: { name: true, slug: true } },
} satisfies Prisma.PostSelect;

export type PostCardData = Prisma.PostGetPayload<{ select: typeof cardSelect }>;

/** A page of published posts, newest first, optionally filtered by category or tag slug. */
export async function getPublishedPosts({
  page = 1,
  categorySlug,
  tagSlug,
}: {
  page?: number;
  categorySlug?: string;
  tagSlug?: string;
}) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);

  const where: Prisma.PostWhereInput = {
    ...PUBLISHED,
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(tagSlug && { tags: { some: { tag: { slug: tagSlug } } } }),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
      select: cardSelect,
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total, pageCount: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)) };
}

/** A published post by slug, or null. Drafts and archived posts are never returned. */
export async function getPublishedPost(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);

  const post = await prisma.post.findFirst({
    where: { ...PUBLISHED, slug },
    select: {
      ...cardSelect,
      content: true,
      updatedAt: true,
      categoryId: true,
      author: { select: { id: true, name: true, bio: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });
  if (!post) return null;

  // Content is sanitized when saved; doing it again here (once per cache entry)
  // protects against rows written some other way, e.g. a database import.
  return { ...post, content: sanitizePostHtml(post.content) };
}

/** Up to 3 other posts: same category first, then the latest ones. */
export async function getRelatedPosts(postId: string, categoryId: string | null) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);

  const take = 3;
  const sameCategory = categoryId
    ? await prisma.post.findMany({
        where: { ...PUBLISHED, categoryId, id: { not: postId } },
        orderBy: { publishedAt: "desc" },
        take,
        select: cardSelect,
      })
    : [];
  if (sameCategory.length >= take) return sameCategory;

  const latest = await prisma.post.findMany({
    where: { ...PUBLISHED, id: { notIn: [postId, ...sameCategory.map((p) => p.id)] } },
    orderBy: { publishedAt: "desc" },
    take: take - sameCategory.length,
    select: cardSelect,
  });
  return [...sameCategory, ...latest];
}

/** Categories that have at least one published post, for the category bar. */
export async function getActiveCategories() {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);

  return prisma.category.findMany({
    where: { posts: { some: PUBLISHED } },
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });
}

export async function getCategory(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);

  return prisma.category.findUnique({ where: { slug }, select: { name: true, slug: true } });
}

export async function getTag(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag(POSTS_TAG);

  return prisma.tag.findUnique({ where: { slug }, select: { name: true, slug: true } });
}
