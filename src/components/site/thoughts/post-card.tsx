import Link from "next/link";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { MediaAsset } from "../media-asset";
import { AuthorAvatar } from "./author-avatar";
import type { ThoughtSummary } from "@/lib/site/thoughts-data";
import { THOUGHTS_BROWSE_LABELS, fillIn } from "@/lib/site/thoughts-labels";

export function formatPostDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "BRAND & DESIGN  •  6 min to read" */
export function PostMeta({
  post,
  className,
  readLabel = THOUGHTS_BROWSE_LABELS.readTime,
}: {
  post: Pick<ThoughtSummary, "category" | "readingMinutes">;
  className?: string;
  /** "{n} min to read" */
  readLabel?: string;
}) {
  return (
    <p
      className={cn(
        "text-surface-muted flex flex-wrap items-center gap-x-2 text-[0.6875rem] font-bold tracking-[0.08em] uppercase",
        className,
      )}
    >
      {post.category && <span>{post.category.name}</span>}
      {post.category && <span aria-hidden>•</span>}
      <span className="normal-case tracking-normal font-normal text-xs">
        {fillIn(readLabel, { n: post.readingMinutes })}
      </span>
    </p>
  );
}

export function PostAuthor({
  author,
  size = 36,
}: {
  author: ThoughtSummary["author"];
  size?: number;
}) {
  if (!author) return null;
  return (
    <span className="flex items-center gap-3">
      <AuthorAvatar name={author.name} src={author.avatar} size={size} />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-bold">{author.name}</span>
        <span className="text-surface-muted text-xs">{author.role}</span>
      </span>
    </span>
  );
}

/**
 * Article card: image, category and reading time, title (serif accent on
 * *starred* words), excerpt. `size="lg"` is the big featured version.
 */
export function PostCard({
  post,
  size = "md",
  readLabel,
  showAuthor = false,
  priority = false,
}: {
  post: ThoughtSummary;
  size?: "md" | "lg";
  readLabel?: string;
  showAuthor?: boolean;
  priority?: boolean;
}) {
  const lg = size === "lg";
  return (
    <Link
      href={`/thoughts/${post.slug}`}
      data-cursor="Read"
      className="group flex flex-col gap-4"
    >
      <span
        className={cn(
          "bg-surface-fg/5 relative block overflow-hidden rounded-[10px]",
          lg ? "aspect-[16/10]" : "aspect-[16/11]",
        )}
      >
        <span className="absolute inset-0 transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105">
          <MediaAsset
            media={{ kind: "image", src: post.cover, alt: "" }}
            sizes={
              lg
                ? "(min-width: 768px) 50vw, 100vw"
                : "(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
            }
            priority={priority}
          />
        </span>
      </span>
      <span className="flex flex-col gap-2.5">
        <PostMeta post={post} readLabel={readLabel} />
        <span
          className={cn(
            "dx-heading leading-snug transition-colors group-hover:text-brand",
            lg
              ? "text-h3 md:text-[1.75rem] md:leading-tight"
              : "text-lg font-bold md:text-xl",
          )}
        >
          <AccentText text={post.title} />
        </span>
        <span
          className={cn(
            "text-surface-muted leading-relaxed",
            lg ? "line-clamp-3 text-[0.9375rem]" : "line-clamp-2 text-sm",
          )}
        >
          {post.excerpt}
        </span>
      </span>
      {showAuthor && <PostAuthor author={post.author} />}
    </Link>
  );
}
