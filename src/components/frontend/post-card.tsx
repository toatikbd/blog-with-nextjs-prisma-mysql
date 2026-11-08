import Link from "next/link";
import type { PostCardData } from "@/lib/posts";
import { PostMeta } from "./post-meta";

/** A post in a grid. `featured` makes it the large hero card at the top of the home page. */
export function PostCard({ post, featured = false }: { post: PostCardData; featured?: boolean }) {
  return (
    <article
      className={`group relative flex flex-col rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-md ${
        featured ? "p-6 md:p-10" : "p-5"
      }`}
    >
      {post.category && (
        // Sits above the stretched title link so it stays clickable on its own.
        <Link
          href={`/category/${post.category.slug}`}
          className="relative z-10 mb-3 self-start rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {post.category.name}
        </Link>
      )}

      <h2
        className={`font-heading font-semibold tracking-tight text-balance ${
          featured ? "text-3xl md:text-4xl" : "text-lg"
        }`}
      >
        {/* The ::after overlay makes the whole card clickable. */}
        <Link
          href={`/blog/${post.slug}`}
          className="group-hover:underline after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {post.title}
        </Link>
      </h2>

      {post.excerpt && (
        <p
          className={`mt-3 text-muted-foreground ${
            featured ? "line-clamp-3 text-lg md:max-w-3xl" : "line-clamp-3 text-sm"
          }`}
        >
          {post.excerpt}
        </p>
      )}

      <PostMeta
        className="mt-auto pt-4"
        authorName={post.author.name}
        publishedAt={post.publishedAt}
        readingTime={post.readingTime}
      />
    </article>
  );
}

export function PostGrid({ posts }: { posts: PostCardData[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export function PostGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
