"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  Eye,
  FileText,
  ImageOff,
  Pencil,
  Plus,
  Star,
  StarOff,
  Trash2,
  Undo2,
} from "lucide-react";
import type { AdminPostRow, Option } from "@/lib/thoughts/admin";
import { stock } from "@/lib/site/stock-media";
import { Button } from "@/components/site/button";
import { StatusPill, type PillTone } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { useConfirm } from "@/components/admin/kit/feedback";
import {
  deletePosts,
  duplicatePost,
  importSamplePosts,
  setPostsFeatured,
  unpublishPosts,
} from "./actions";

type Result = { success: boolean; message?: string };
const plain = (t: string) => t.replace(/\*/g, "");

const dateText = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function stateOf(
  p: AdminPostRow,
  now: number,
): {
  label: "Draft" | "Scheduled" | "Published";
  tone: PillTone;
  date: string;
} {
  if (p.status === "DRAFT")
    return {
      label: "Draft",
      tone: "neutral",
      date: `Edited ${dateText(p.updatedAt)}`,
    };
  const at = p.publishedAt ? Date.parse(p.publishedAt) : 0;
  return at > now
    ? {
        label: "Scheduled",
        tone: "warning",
        date: `Goes live ${dateText(p.publishedAt!)}`,
      }
    : {
        label: "Published",
        tone: "success",
        date: dateText(p.publishedAt ?? p.updatedAt),
      };
}

export function PostsManager({
  posts,
  categories,
  authors,
}: {
  posts: AdminPostRow[];
  categories: Option[];
  authors: Option[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [, start] = useTransition();
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), []);
  const catName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "";
  const authorName = (id: string) =>
    authors.find((a) => a.id === id)?.name ?? "";

  const run = (fn: () => Promise<Result>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (!res.success)
        return void toast.error(res.message ?? "That didn't work.");
      toast.success(ok);
      router.refresh();
    });

  const preview = (slug: string) =>
    `/api/preview?path=${encodeURIComponent(`/thoughts/${slug}`)}`;

  const columns: Column<AdminPostRow>[] = [
    {
      key: "title",
      header: "Article",
      primary: true,
      sortValue: (p) => plain(p.title).toLowerCase(),
      cell: (p) => (
        <span className="flex min-w-0 items-center gap-3">
          {p.cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- previews from any host
            <img
              src={stock(p.cover, 128, 80)}
              alt=""
              className="bg-canvas h-10 w-16 shrink-0 rounded-[6px] object-cover"
            />
          ) : (
            <span className="bg-canvas text-surface-muted inline-flex h-10 w-16 shrink-0 items-center justify-center rounded-[6px]">
              <ImageOff aria-hidden className="size-4" />
            </span>
          )}
          <span className="flex min-w-0 flex-col gap-1">
            <Link
              href={`/admin/thoughts/${p.id}`}
              className="line-clamp-2 font-bold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {plain(p.title) || "Untitled"}
            </Link>
            {p.isFeatured && (
              <span>
                <StatusPill tone="brand">Featured</StatusPill>
              </span>
            )}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (p) => stateOf(p, now).label,
      cell: (p) => {
        const s = stateOf(p, now);
        return (
          <span className="flex flex-col items-start gap-1">
            <StatusPill tone={s.tone} dot>
              {s.label}
            </StatusPill>
            <span className="text-surface-muted text-xs">{s.date}</span>
          </span>
        );
      },
    },
    {
      key: "category",
      header: "Category",
      hideBelow: "lg",
      sortValue: (p) => catName(p.categoryId),
      cell: (p) => catName(p.categoryId) || "—",
    },
    {
      key: "author",
      header: "Author",
      hideBelow: "xl",
      sortValue: (p) => authorName(p.authorId),
      cell: (p) => authorName(p.authorId) || "—",
    },
    {
      key: "date",
      header: "Date",
      hideOnMobile: true,
      sortValue: (p) => p.publishedAt ?? p.updatedAt,
      cell: (p) => dateText(p.publishedAt ?? p.updatedAt),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {posts.length === 0 && (
        <Callout
          tone="info"
          title="No articles yet"
          action={
            <Button
              size="sm"
              variant="subtle"
              onClick={() =>
                run(async () => {
                  const res = await importSamplePosts();
                  return res;
                }, "Sample articles added as drafts")
              }
            >
              Add the sample articles as drafts
            </Button>
          }
        >
          Write your first article, or start from the site&apos;s six sample
          articles. They come in as drafts, so nothing goes live until you
          publish it.
        </Callout>
      )}
      <DataTable
        label="Articles"
        rows={posts}
        columns={columns}
        getRowId={(p) => p.id}
        rowLabel={(p) => plain(p.title)}
        searchText={(p) =>
          `${plain(p.title)} ${p.tags.join(" ")} ${catName(p.categoryId)} ${authorName(p.authorId)}`
        }
        searchPlaceholder="Search articles"
        onRowClick={(p) => router.push(`/admin/thoughts/${p.id}`)}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "Draft", label: "Drafts" },
              { value: "Scheduled", label: "Scheduled" },
              { value: "Published", label: "Published" },
              { value: "featured", label: "Featured" },
            ],
            match: (p, v) =>
              v === "featured" ? p.isFeatured : stateOf(p, now).label === v,
          },
          {
            key: "category",
            label: "Category",
            options: [
              ...categories.map((c) => ({ value: c.id, label: c.name })),
              { value: "none", label: "No category" },
            ],
            match: (p, v) =>
              v === "none" ? !p.categoryId : p.categoryId === v,
          },
          ...(authors.length > 1
            ? [
                {
                  key: "author",
                  label: "Author",
                  options: authors.map((a) => ({ value: a.id, label: a.name })),
                  match: (p: AdminPostRow, v: string) => p.authorId === v,
                },
              ]
            : []),
        ]}
        bulkActions={[
          {
            label: "Feature",
            icon: <Star />,
            onClick: (ids) =>
              run(() => setPostsFeatured(ids, true), "Featured"),
          },
          {
            label: "Unfeature",
            icon: <StarOff />,
            onClick: (ids) =>
              run(() => setPostsFeatured(ids, false), "Unfeatured"),
          },
          {
            label: "Move to drafts",
            icon: <Undo2 />,
            onClick: async (ids) => {
              const ok = await confirm({
                title: `Move ${ids.length} article${ids.length === 1 ? "" : "s"} to drafts?`,
                description:
                  "Published ones leave the site until you publish them again.",
                confirmLabel: "Move to drafts",
              });
              if (ok) run(() => unpublishPosts(ids), "Moved to drafts");
            },
          },
          {
            label: "Delete",
            icon: <Trash2 />,
            danger: true,
            onClick: async (ids) => {
              const ok = await confirm({
                title: `Delete ${ids.length} article${ids.length === 1 ? "" : "s"}?`,
                description:
                  "This can't be undone. To keep them, move them to drafts instead.",
                confirmLabel: "Delete",
                danger: true,
              });
              if (ok) run(() => deletePosts(ids), "Deleted");
            },
          },
        ]}
        rowActions={(p) => {
          const s = stateOf(p, now);
          return [
            {
              label: "Edit",
              icon: <Pencil />,
              href: `/admin/thoughts/${p.id}`,
            },
            s.label === "Published"
              ? {
                  label: "View on site",
                  icon: <ExternalLink />,
                  href: `/thoughts/${p.slug}`,
                  external: true,
                }
              : {
                  label: "Preview",
                  icon: <Eye />,
                  href: preview(p.slug),
                  external: true,
                },
            {
              label: "Duplicate",
              icon: <Copy />,
              onSelect: () =>
                run(() => duplicatePost(p.id), "Copied as a draft"),
            },
            "separator",
            {
              label: p.isFeatured ? "Unfeature" : "Feature",
              icon: p.isFeatured ? <StarOff /> : <Star />,
              onSelect: () =>
                run(
                  () => setPostsFeatured([p.id], !p.isFeatured),
                  p.isFeatured ? "Unfeatured" : "Featured",
                ),
            },
            {
              label: s.label === "Scheduled" ? "Cancel schedule" : "Unpublish",
              icon: <Undo2 />,
              hidden: s.label === "Draft",
              onSelect: () =>
                run(() => unpublishPosts([p.id]), "Moved to drafts"),
            },
            "separator",
            {
              label: "Delete",
              icon: <Trash2 />,
              danger: true,
              onSelect: async () => {
                const ok = await confirm({
                  title: `Delete “${plain(p.title)}”?`,
                  description: "This can't be undone.",
                  confirmLabel: "Delete",
                  danger: true,
                });
                if (ok) run(() => deletePosts([p.id]), "Deleted");
              },
            },
          ];
        }}
        toolbar={
          <Button size="sm" href="/admin/thoughts/new">
            <Plus aria-hidden className="size-4" /> New article
          </Button>
        }
        empty={{
          icon: <FileText />,
          title: "No articles match",
          description: "Try another search or filter.",
        }}
      />
    </div>
  );
}
