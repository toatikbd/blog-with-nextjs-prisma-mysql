import { Suspense } from "react";
import { CategoryBar } from "@/components/frontend/category-bar";
import { Pagination, parsePage } from "@/components/frontend/pagination";
import { PostCard, PostGrid, PostGridSkeleton } from "@/components/frontend/post-card";
import { getPublishedPosts } from "@/lib/posts";

// Home feed: the newest post as a large card on page 1, then a grid.
export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
      <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">Latest posts</h1>
      <div className="mt-6">
        {/* Cached data, so the bar is part of the prerendered page. */}
        <CategoryBar />
      </div>

      {/* ?page= is only known at request time; the posts themselves come from the cache. */}
      <Suspense
        fallback={
          <div className="mt-8 grid gap-6">
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
            <PostGridSkeleton />
          </div>
        }
      >
        <Feed searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Feed({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const page = parsePage((await searchParams).page);
  const { posts, pageCount } = await getPublishedPosts({ page });

  if (posts.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        {page > 1 ? "There are no posts on this page." : "No posts have been published yet."}
      </div>
    );
  }

  const [featured, ...rest] = posts;
  return (
    <div className="mt-8">
      {page === 1 ? (
        <>
          <PostCard post={featured} featured />
          {rest.length > 0 && (
            <div className="mt-6">
              <PostGrid posts={rest} />
            </div>
          )}
        </>
      ) : (
        <PostGrid posts={posts} />
      )}
      <Pagination basePath="/" page={page} pageCount={pageCount} />
    </div>
  );
}
