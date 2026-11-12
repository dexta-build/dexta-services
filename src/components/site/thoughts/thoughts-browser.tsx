"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import { PostCard } from "./post-card";
import {
  THOUGHTS_BROWSE_LABELS,
  fillIn,
  type ThoughtsBrowseLabels,
} from "@/lib/site/thoughts-labels";
import type { ThoughtCategory, ThoughtSummary } from "@/lib/site/thoughts-data";

const PAGE_SIZE = 9;

export type ThoughtSort = "latest" | "oldest";

/**
 * Category, search and sort above a three-column grid with "Load more", as
 * on Superside's blog. On a category page the category menu moves between
 * category pages instead of filtering in place.
 */
export function ThoughtsBrowser({
  posts,
  categories,
  basePath,
  lockedCategory,
  initialQuery = "",
  initialSort = "latest",
  labels: L = THOUGHTS_BROWSE_LABELS,
}: {
  labels?: ThoughtsBrowseLabels;
  posts: ThoughtSummary[];
  categories: ThoughtCategory[];
  /** Where the filters live in the URL, e.g. /thoughts. */
  basePath: string;
  /** Set on /thoughts/category/[slug]. */
  lockedCategory?: string;
  initialQuery?: string;
  initialSort?: ThoughtSort;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<ThoughtSort>(initialSort);
  const [shown, setShown] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = posts.filter(
      (p) =>
        (!lockedCategory || p.category?.slug === lockedCategory) &&
        (!q ||
          [p.title, p.excerpt, p.category?.name ?? "", ...p.tags]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
    return sort === "oldest" ? [...list].reverse() : list;
  }, [posts, query, sort, lockedCategory]);

  // Keep search and sort in the address bar.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (sort !== "latest") params.set("sort", sort);
    const qs = params.toString();
    const next = `${basePath}${qs ? `?${qs}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [query, sort, basePath]);

  const visible = filtered.slice(0, shown);

  return (
    <div>
      <div className="border-surface-rule mb-10 flex flex-col gap-3 border-b pb-6 md:flex-row md:items-center md:gap-4">
        <label className="relative md:w-56">
          <span className="sr-only">Category</span>
          <select
            value={lockedCategory ?? ""}
            onChange={(e) =>
              router.push(
                e.target.value
                  ? `/thoughts/category/${e.target.value}`
                  : "/thoughts#all-thoughts",
              )
            }
            className="border-surface-fg/20 focus:border-surface-fg h-11 w-full cursor-pointer appearance-none rounded-full border bg-transparent pr-9 pl-4 text-sm outline-none"
          >
            <option value="">{L.allCategories}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="text-surface-muted pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs"
          >
            ▾
          </span>
        </label>

        <label className="border-surface-fg/20 focus-within:border-surface-fg flex h-11 items-center gap-2 rounded-full border px-4 md:ml-auto md:w-72">
          <Search aria-hidden className="text-surface-muted size-4 shrink-0" />
          <span className="sr-only">Search thoughts</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE_SIZE);
            }}
            placeholder={L.searchPlaceholder}
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-surface-muted shrink-0">{L.sortLabel}</span>
          <span className="relative flex-1 md:flex-none">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ThoughtSort)}
              className="border-surface-fg/20 focus:border-surface-fg h-11 w-full cursor-pointer appearance-none rounded-full border bg-transparent pr-9 pl-4 outline-none md:w-36"
            >
              <option value="latest">{L.latest}</option>
              <option value="oldest">{L.oldest}</option>
            </select>
            <span
              aria-hidden
              className="text-surface-muted pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs"
            >
              ▾
            </span>
          </span>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="border-surface-rule rounded-[10px] border border-dashed px-6 py-16 text-center">
          <p className="text-h3">
            {posts.length === 0 ? L.noneTitle : L.noMatchTitle}
          </p>
          <p className="text-surface-muted mt-2 text-sm">
            {posts.length === 0 ? L.noneBody : L.noMatchBody}
          </p>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-5 inline-flex items-center gap-1 text-sm font-bold"
            >
              <X className="size-4" /> {L.clearSearch}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => (
              <PostCard key={p.id} post={p} readLabel={L.readTime} />
            ))}
          </div>
          {filtered.length > shown && (
            <div className="mt-14 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShown((n) => n + PAGE_SIZE)}
              >
                {L.loadMore}
              </Button>
            </div>
          )}
          <p
            className={cn(
              "text-surface-muted mt-6 text-center text-xs",
              filtered.length <= shown && "sr-only",
            )}
            aria-live="polite"
          >
            {fillIn(L.showing, {
              shown: visible.length,
              total: filtered.length,
            })}
          </p>
        </>
      )}
    </div>
  );
}
