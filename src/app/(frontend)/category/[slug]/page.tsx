import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryBar } from "@/components/frontend/category-bar";
import { Pagination, parsePage } from "@/components/frontend/pagination";
import { PostGrid, PostGridSkeleton } from "@/components/frontend/post-card";
import { getCategory, getPublishedPosts } from "@/lib/posts";

export async function generateMetadata({
  params,
}: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: `Posts in ${category.name}.`,
    alternates: { canonical: `/category/${category.slug}` },
  };
}

export default function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
      <Suspense fallback={<ListSkeleton />}>
        <CategoryPosts params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function CategoryPosts({ params, searchParams }: PageProps<"/category/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();

  const page = parsePage(query.page);
  const { posts, total, pageCount } = await getPublishedPosts({ page, categorySlug: slug });

  return (
    <>
      <p className="text-sm font-medium text-muted-foreground">Category</p>
      <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight md:text-4xl">
        {category.name}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {total} {total === 1 ? "post" : "posts"}
      </p>
      <div className="mt-6">
        <CategoryBar active={category.slug} />
      </div>

      <div className="mt-8">
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            No published posts in this category yet.
          </div>
        ) : (
          <PostGrid posts={posts} />
        )}
      </div>
      <Pagination basePath={`/category/${category.slug}`} page={page} pageCount={pageCount} />
    </>
  );
}

function ListSkeleton() {
  return (
    <div aria-hidden>
      <div className="h-10 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-10">
        <PostGridSkeleton />
      </div>
    </div>
  );
}
