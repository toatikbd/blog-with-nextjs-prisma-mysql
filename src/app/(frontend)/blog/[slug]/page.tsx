import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostGrid } from "@/components/frontend/post-card";
import { PostMeta } from "@/components/frontend/post-meta";
import { getPublishedPost, getRelatedPosts } from "@/lib/posts";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Post not found" };

  const description = post.excerpt ?? undefined;
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author.name ? [post.author.name] : undefined,
      tags: post.tags.map((t) => t.tag.name),
    },
  };
}

// Post detail. Rendered on the first visit, then served from the cache until the
// post (or its category, tags or author) changes in the admin panel.
export default function PostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <Post params={params} />
    </Suspense>
  );
}

async function Post({ params }: { params: PageProps<"/blog/[slug]">["params"] }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.id, post.categoryId);

  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
        <header>
          {post.category && (
            <Link
              href={`/category/${post.category.slug}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {post.category.name}
            </Link>
          )}
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-balance md:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">{post.excerpt}</p>
          )}
          <PostMeta
            className="mt-6 border-b pb-6"
            authorName={post.author.name}
            publishedAt={post.publishedAt}
            readingTime={post.readingTime}
          />
        </header>

        <div
          className="prose prose-lg mt-8 max-w-none font-serif prose-neutral dark:prose-invert prose-headings:font-heading prose-a:underline-offset-4"
          // Sanitized on save and again in getPublishedPost().
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags.length > 0 && (
          <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
            {post.tags.map(({ tag }) => (
              <li key={tag.slug}>
                <Link
                  href={`/tag/${tag.slug}`}
                  className="inline-flex rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  #{tag.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {post.author.name && (
          <aside className="mt-10 rounded-xl bg-muted/50 p-5">
            <p className="text-sm text-muted-foreground">Written by</p>
            <p className="mt-1 font-heading font-semibold">{post.author.name}</p>
            {post.author.bio && (
              <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">
                {post.author.bio}
              </p>
            )}
          </aside>
        )}
      </article>

      {related.length > 0 && (
        <section className="border-t bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-4 py-12">
            <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight">
              Keep reading
            </h2>
            <PostGrid posts={related} />
          </div>
        </section>
      )}
    </>
  );
}

function PostSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14" aria-hidden>
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-12 w-4/5 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-6 w-3/5 animate-pulse rounded bg-muted" />
      <div className="mt-10 grid gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
