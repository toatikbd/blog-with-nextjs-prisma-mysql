import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Pagination, parsePage } from "@/components/frontend/pagination";
import { PostGrid, PostGridSkeleton } from "@/components/frontend/post-card";
import { getPublishedPosts, getTag } from "@/lib/posts";

export async function generateMetadata({ params }: PageProps<"/tag/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);
  if (!tag) return { title: "Tag not found" };
  return {
    title: `#${tag.name}`,
    description: `Posts tagged ${tag.name}.`,
    alternates: { canonical: `/tag/${tag.slug}` },
  };
}

export default function TagPage({ params, searchParams }: PageProps<"/tag/[slug]">) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
      <Suspense
        fallback={
          <div aria-hidden>
            <div className="h-10 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-10">
              <PostGridSkeleton />
            </div>
          </div>
        }
      >
        <TagPosts params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function TagPosts({ params, searchParams }: PageProps<"/tag/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const tag = await getTag(slug);
  if (!tag) notFound();

  const page = parsePage(query.page);
  const { posts, total, pageCount } = await getPublishedPosts({ page, tagSlug: slug });

  return (
    <>
      <p className="text-sm font-medium text-muted-foreground">Tag</p>
      <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight md:text-4xl">
        #{tag.name}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {total} {total === 1 ? "post" : "posts"}
      </p>

      <div className="mt-8">
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            No published posts with this tag yet.
          </div>
        ) : (
          <PostGrid posts={posts} />
        )}
      </div>
      <Pagination basePath={`/tag/${tag.slug}`} page={page} pageCount={pageCount} />
    </>
  );
}
