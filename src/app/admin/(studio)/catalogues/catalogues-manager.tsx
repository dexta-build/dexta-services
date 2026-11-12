"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Home,
  LayoutGrid,
  Pencil,
  Plus,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import type { AdminCatalogueRow } from "@/lib/catalogue/admin";
import type { CatalogueForm } from "@/lib/catalogue/fields";
import { stock } from "@/lib/site/stock-media";
import { Button } from "@/components/site/button";
import { NavIcon } from "@/components/site/shell/nav-icon";
import { asIcon } from "@/components/site/shell/nav-data";
import { StatusPill } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { SortableList } from "@/components/admin/kit/sortable-list";
import { RowActions } from "@/components/admin/kit/row-actions";
import { useConfirm } from "@/components/admin/kit/feedback";
import {
  deleteCatalogue,
  deleteSampleItems,
  reorderCatalogues,
  setCatalogueFlags,
} from "./actions";
import { CataloguePanel, EMPTY_CATALOGUE } from "./catalogue-panel";

type Result = { success: boolean; message?: string };

export const formOf = (c: AdminCatalogueRow): CatalogueForm => ({
  title: c.title,
  slug: c.slug,
  description: c.description,
  color: c.color,
  icon: c.icon,
  cover: c.cover,
  heroTitle: c.heroTitle,
  heroText: c.heroText,
  isFeatured: c.isFeatured,
  showOnHome: c.showOnHome,
  isVisible: c.isVisible,
});

export function CataloguesManager({
  catalogues,
}: {
  catalogues: AdminCatalogueRow[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [items, setItems] = useState(catalogues);
  const [editing, setEditing] = useState<AdminCatalogueRow | "new" | null>(
    null,
  );
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setItems(catalogues), [catalogues]);

  const samples = catalogues.reduce((n, c) => n + c.sampleCount, 0);
  const run = (fn: () => Promise<Result>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (!res.success)
        return void toast.error(res.message ?? "That didn't work.");
      toast.success(ok);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-5">
      {samples > 0 && (
        <Callout
          tone="warning"
          title={`${samples} sample design${samples === 1 ? "" : "s"} with placeholder prices`}
          action={
            <Button
              size="sm"
              variant="subtle"
              onClick={async () => {
                const ok = await confirm({
                  title: `Delete all ${samples} sample designs?`,
                  description:
                    "Catalogues and categories stay. Catalogues without designs show an empty grid until you add some.",
                  confirmLabel: "Delete samples",
                  danger: true,
                });
                if (ok)
                  run(() => deleteSampleItems(null), "Sample designs deleted");
              }}
            >
              Delete all samples
            </Button>
          }
        >
          The catalogues were filled with the site&apos;s sample designs so
          nothing went blank. Edit them with your real prices (they stop being
          samples once saved), or delete them and add your own.
        </Callout>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus aria-hidden className="size-4" /> Add catalogue
        </Button>
      </div>

      <SortableList
        label="Catalogue order"
        items={items}
        getId={(c) => c.id}
        onReorder={(next) => {
          setItems(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(async () => {
            const res = await reorderCatalogues(next.map((c) => c.id));
            if (!res.success) toast.error(res.message);
            else toast.success("Order saved");
          }, 700);
        }}
        renderItem={(c) => (
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/catalogues/${c.id}`}
              className="flex min-w-0 flex-1 items-center gap-3 outline-none focus-visible:underline"
            >
              <span
                data-surface={c.color}
                className="bg-surface text-surface-fg relative inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px]"
              >
                {c.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- previews from any host
                  <img
                    src={stock(c.cover, 120, 120)}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <NavIcon name={asIcon(c.icon)} className="size-5" />
                )}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">{c.title}</span>
                  {!c.isVisible && <StatusPill>Hidden</StatusPill>}
                  {c.isFeatured && (
                    <StatusPill tone="brand">Menu card</StatusPill>
                  )}
                  {c.showOnHome && c.isVisible && (
                    <StatusPill tone="success">Homepage</StatusPill>
                  )}
                  {c.sampleCount > 0 && (
                    <StatusPill tone="warning">
                      {c.sampleCount} sample{c.sampleCount === 1 ? "" : "s"}
                    </StatusPill>
                  )}
                </span>
                <span className="text-surface-muted truncate text-xs">
                  {c.itemCount} design{c.itemCount === 1 ? "" : "s"} ·{" "}
                  {c.description || `/catalogue/${c.slug}`}
                </span>
              </span>
            </Link>
            <Button
              href={`/admin/catalogues/${c.id}`}
              size="sm"
              variant="subtle"
              className="hidden sm:inline-flex"
            >
              Designs
            </Button>
            <RowActions
              label={`Actions for ${c.title}`}
              title={c.title}
              actions={[
                {
                  label: "Designs and categories",
                  icon: <LayoutGrid />,
                  href: `/admin/catalogues/${c.id}`,
                },
                {
                  label: "Edit details",
                  icon: <Pencil />,
                  onSelect: () => setEditing(c),
                },
                {
                  label: "View on site",
                  icon: <ExternalLink />,
                  href: `/catalogue/${c.slug}`,
                  external: true,
                  hidden: !c.isVisible,
                },
                "separator",
                {
                  label: c.isFeatured
                    ? "Remove menu card"
                    : "Show as menu card",
                  icon: c.isFeatured ? <StarOff /> : <Star />,
                  onSelect: () =>
                    run(
                      () =>
                        setCatalogueFlags(c.id, { isFeatured: !c.isFeatured }),
                      c.isFeatured
                        ? "Removed from the menu cards"
                        : "Shown as a menu card",
                    ),
                },
                {
                  label: c.showOnHome
                    ? "Remove from homepage"
                    : "Show on homepage",
                  icon: <Home />,
                  onSelect: () =>
                    run(
                      () =>
                        setCatalogueFlags(c.id, { showOnHome: !c.showOnHome }),
                      c.showOnHome
                        ? "Removed from the homepage"
                        : "Added to the homepage",
                    ),
                },
                {
                  label: c.isVisible ? "Hide" : "Show",
                  icon: c.isVisible ? <EyeOff /> : <Eye />,
                  onSelect: () =>
                    run(
                      () =>
                        setCatalogueFlags(c.id, { isVisible: !c.isVisible }),
                      c.isVisible ? "Hidden" : "Shown",
                    ),
                },
                "separator",
                {
                  label: "Delete",
                  icon: <Trash2 />,
                  danger: true,
                  onSelect: async () => {
                    const ok = await confirm({
                      title: `Delete the ${c.title} catalogue?`,
                      description: `Its page and all ${c.itemCount} designs are deleted. To keep them, hide it instead.`,
                      confirmLabel: "Delete catalogue",
                      danger: true,
                    });
                    if (ok)
                      run(() => deleteCatalogue(c.id), "Catalogue deleted");
                  },
                },
              ]}
            />
          </div>
        )}
      />

      <CataloguePanel
        key={editing === "new" ? "new" : (editing?.id ?? "closed")}
        id={editing === "new" ? null : (editing?.id ?? null)}
        initial={
          editing && editing !== "new" ? formOf(editing) : EMPTY_CATALOGUE
        }
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={(id) => {
          const wasNew = editing === "new";
          setEditing(null);
          if (wasNew) router.push(`/admin/catalogues/${id}`);
          else router.refresh();
        }}
      />
    </div>
  );
}
