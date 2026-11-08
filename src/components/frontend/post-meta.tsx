const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

/** "Jane Doe · Nov 8, 2026 · 4 min read" */
export function PostMeta({
  authorName,
  publishedAt,
  readingTime,
  className = "",
}: {
  authorName: string | null;
  publishedAt: Date | null;
  readingTime: number;
  className?: string;
}) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground ${className}`}>
      {authorName && <span className="font-medium text-foreground">{authorName}</span>}
      {authorName && publishedAt && <span aria-hidden>·</span>}
      {publishedAt && (
        <time dateTime={publishedAt.toISOString()}>{dateFormat.format(publishedAt)}</time>
      )}
      <span aria-hidden>·</span>
      <span>{readingTime} min read</span>
    </p>
  );
}
