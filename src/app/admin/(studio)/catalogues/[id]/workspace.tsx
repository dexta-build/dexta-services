"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FolderInput,
  ImageOff,
  Pencil,
  Play,
  Plus,
  Star,
  StarOff,
  Tags,
  Trash2,
  Upload,
} from "lucide-react";
import type {
  AdminCatalogueRow,
  AdminCategory,
  AdminItem,
} from "@/lib/catalogue/admin";
import type { ItemForm } from "@/lib/catalogue/fields";
import { isVideoSource, stock } from "@/lib/site/stock-media";
import { Button } from "@/components/site/button";
import {
  PageHeader,
  StatusPill,
  EmptyState,
} from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { Tabs, Modal } from "@/components/admin/kit/overlays";
import { SortableList } from "@/components/admin/kit/sortable-list";
import { RowActions } from "@/components/admin/kit/row-actions";
import { SearchInput } from "@/components/admin/kit/inputs";
import { SelectField, TextField } from "@/components/admin/kit/fields";
import { SaveBar } from "@/components/admin/kit/save-bar";
import { useConfirm } from "@/components/admin/kit/feedback";
import { formOf } from "../catalogues-manager";
import { CataloguePanel } from "../catalogue-panel";
import {
  deleteCategory,
  deleteItems,
  deleteSampleItems,
  reorderCategories,
  reorderItems,
  saveCategory,
  savePrices,
  setCategoryVisible,
  setItemsFlags,
} from "../actions";
import { EMPTY_ITEM, ItemPanel } from "./item-panel";
import {
  CsvImportDialog,
  MoveDialog,
  PriceDialog,
  exportCsv,
} from "./bulk-dialogs";

type Result = { success: boolean; message?: string };
const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const formOfItem = (it: AdminItem): ItemForm => ({
  title: it.title,
  slug: it.slug,
  description: it.description,
  categoryId: it.categoryId,
  price: it.price,
  moq: it.moq,
  unit: it.unit,
  tags: it.tags,
  media: it.media,
  isFeatured: it.isFeatured,
  isVisible: it.isVisible,
});

export function CatalogueWorkspace({
  row,
  categories,
  items,
}: {
  row: AdminCatalogueRow;
  categories: AdminCategory[];
  items: AdminItem[];
}) {
  const router = useRouter();
  const [editingDetails, setEditingDetails] = useState(false);
  const [tab, setTab] = useState("designs");

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Catalogues", href: "/admin/catalogues" },
          { label: row.title },
        ]}
        title={`*${row.title}* catalogue`}
        description={`${items.length} design${items.length === 1 ? "" : "s"} in ${categories.length} categor${categories.length === 1 ? "y" : "ies"}.${row.isVisible ? "" : " Hidden from the site."}`}
        actions={
          <>
            <Button
              size="sm"
              variant="subtle"
              onClick={() => setEditingDetails(true)}
            >
              <Pencil aria-hidden className="size-4" /> Details
            </Button>
            {row.isVisible && (
              <Button
                size="sm"
                variant="subtle"
                href={`/catalogue/${row.slug}`}
                external
              >
                View <ExternalLink aria-hidden className="size-4" />
              </Button>
            )}
          </>
        }
      />
      <Tabs
        label="Catalogue sections"
        value={tab}
        onValueChange={setTab}
        tabs={[
          {
            value: "designs",
            label: "Designs",
            badge: items.length,
            content: (
              <DesignsTab row={row} categories={categories} items={items} />
            ),
          },
          {
            value: "categories",
            label: "Categories",
            badge: categories.length,
            content: (
              <CategoriesTab catalogueId={row.id} categories={categories} />
            ),
          },
          {
            value: "prices",
            label: "Price sheet",
            content: (
              <PricesTab
                catalogueId={row.id}
                categories={categories}
                items={items}
              />
            ),
          },
        ]}
      />
      <CataloguePanel
        key={editingDetails ? "open" : "closed"}
        id={row.id}
        initial={formOf(row)}
        open={editingDetails}
        onClose={() => setEditingDetails(false)}
        onSaved={() => {
          setEditingDetails(false);
          router.refresh();
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Designs                                                             */
/* ------------------------------------------------------------------ */

function Thumb({ item }: { item: AdminItem }) {
  const first = item.media[0];
  const cls =
    "bg-canvas inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[8px]";
  if (!first)
    return (
      <span className={`${cls} text-surface-muted`}>
        <ImageOff aria-hidden className="size-4" />
      </span>
    );
  if (isVideoSource(first))
    return (
      <span className={`${cls} text-royal`}>
        <Play aria-hidden className="size-4" />
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- previews from any host
    <img src={stock(first, 96, 96)} alt="" className={`${cls} object-cover`} />
  );
}

function DesignsTab({
  row,
  categories,
  items,
}: {
  row: AdminCatalogueRow;
  categories: AdminCategory[];
  items: AdminItem[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [, start] = useTransition();
  const [editing, setEditing] = useState<AdminItem | "new" | null>(null);
  const [priceIds, setPriceIds] = useState<string[] | null>(null);
  const [moveIds, setMoveIds] = useState<string[] | null>(null);
  const [importing, setImporting] = useState(false);
  const catName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "Other";
  const samples = items.filter((i) => i.isSample).length;

  const run = (fn: () => Promise<Result>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (!res.success)
        return void toast.error(res.message ?? "That didn't work.");
      toast.success(ok);
      router.refresh();
    });

  const move = (it: AdminItem, by: -1 | 1) => {
    const order = items.map((i) => i.id);
    const at = order.indexOf(it.id);
    const to = at + by;
    if (to < 0 || to >= order.length) return;
    [order[at], order[to]] = [order[to], order[at]];
    run(() => reorderItems(row.id, order), "Order saved");
  };

  const columns: Column<AdminItem>[] = [
    {
      key: "title",
      header: "Design",
      primary: true,
      sortValue: (it) => it.title.toLowerCase(),
      cell: (it) => (
        <span className="flex min-w-0 items-center gap-3">
          <Thumb item={it} />
          <span className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-bold">{it.title}</span>
            <span className="flex flex-wrap gap-1.5">
              {it.isFeatured && <StatusPill tone="brand">Featured</StatusPill>}
              {!it.isVisible && <StatusPill>Hidden</StatusPill>}
              {it.isSample && <StatusPill tone="warning">Sample</StatusPill>}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortValue: (it) => catName(it.categoryId),
      cell: (it) => catName(it.categoryId),
    },
    {
      key: "price",
      header: "Price",
      sortValue: (it) => it.price,
      className: "text-right tabular-nums",
      cell: (it) => (
        <span className="font-bold">
          {naira(it.price)}
          <span className="text-surface-muted font-normal"> / {it.unit}</span>
        </span>
      ),
    },
    {
      key: "moq",
      header: "Minimum",
      sortValue: (it) => it.moq,
      className: "text-right tabular-nums",
      hideBelow: "lg",
      cell: (it) => it.moq.toLocaleString("en-NG"),
    },
    {
      key: "media",
      header: "Media",
      hideBelow: "xl",
      className: "text-right tabular-nums",
      sortValue: (it) => it.media.length,
      cell: (it) => it.media.length,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {samples > 0 && (
        <Callout
          tone="warning"
          title={`${samples} sample design${samples === 1 ? "" : "s"} in this catalogue`}
          action={
            <Button
              size="sm"
              variant="subtle"
              onClick={async () => {
                const ok = await confirm({
                  title: `Delete ${samples} sample design${samples === 1 ? "" : "s"}?`,
                  description: "Your own designs stay.",
                  confirmLabel: "Delete samples",
                  danger: true,
                });
                if (ok)
                  run(
                    () => deleteSampleItems(row.id),
                    "Sample designs deleted",
                  );
              }}
            >
              Delete samples
            </Button>
          }
        >
          Their prices are placeholders. Edit them (or use the price sheet) to
          make them yours, or delete them.
        </Callout>
      )}
      <DataTable
        label={`${row.title} designs`}
        rows={items}
        columns={columns}
        getRowId={(it) => it.id}
        rowLabel={(it) => it.title}
        searchText={(it) =>
          `${it.title} ${it.description} ${it.tags.join(" ")} ${catName(it.categoryId)}`
        }
        searchPlaceholder="Search designs"
        onRowClick={(it) => setEditing(it)}
        filters={[
          {
            key: "category",
            label: "Category",
            options: [
              ...categories.map((c) => ({ value: c.id, label: c.name })),
              { value: "none", label: "Other" },
            ],
            match: (it, v) =>
              v === "none" ? !it.categoryId : it.categoryId === v,
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "visible", label: "On the site" },
              { value: "hidden", label: "Hidden" },
              { value: "featured", label: "Featured" },
              { value: "sample", label: "Samples" },
              { value: "nomedia", label: "No images" },
            ],
            match: (it, v) =>
              v === "visible"
                ? it.isVisible
                : v === "hidden"
                  ? !it.isVisible
                  : v === "featured"
                    ? it.isFeatured
                    : v === "sample"
                      ? it.isSample
                      : it.media.length === 0,
          },
        ]}
        bulkActions={[
          {
            label: "Change prices",
            icon: <Tags />,
            onClick: (ids) => setPriceIds(ids),
          },
          {
            label: "Move",
            icon: <FolderInput />,
            onClick: (ids) => setMoveIds(ids),
          },
          {
            label: "Feature",
            icon: <Star />,
            onClick: (ids) =>
              run(
                () => setItemsFlags(row.id, ids, { isFeatured: true }),
                "Featured",
              ),
          },
          {
            label: "Unfeature",
            icon: <StarOff />,
            onClick: (ids) =>
              run(
                () => setItemsFlags(row.id, ids, { isFeatured: false }),
                "Unfeatured",
              ),
          },
          {
            label: "Show",
            icon: <Eye />,
            onClick: (ids) =>
              run(
                () => setItemsFlags(row.id, ids, { isVisible: true }),
                "Shown",
              ),
          },
          {
            label: "Hide",
            icon: <EyeOff />,
            onClick: (ids) =>
              run(
                () => setItemsFlags(row.id, ids, { isVisible: false }),
                "Hidden",
              ),
          },
          {
            label: "Delete",
            icon: <Trash2 />,
            danger: true,
            onClick: async (ids) => {
              const ok = await confirm({
                title: `Delete ${ids.length} design${ids.length === 1 ? "" : "s"}?`,
                description:
                  "They leave the catalogue for good. To keep them, hide them instead.",
                confirmLabel: "Delete",
                danger: true,
              });
              if (ok) run(() => deleteItems(row.id, ids), "Deleted");
            },
          },
        ]}
        rowActions={(it) => [
          { label: "Edit", icon: <Pencil />, onSelect: () => setEditing(it) },
          {
            label: "View on site",
            icon: <ExternalLink />,
            href: `/catalogue/${row.slug}/${it.slug}`,
            external: true,
            hidden: !it.isVisible || !row.isVisible,
          },
          {
            label: "Change price",
            icon: <Tags />,
            onSelect: () => setPriceIds([it.id]),
          },
          "separator",
          {
            label: "Move up",
            icon: <ArrowUp />,
            onSelect: () => move(it, -1),
            disabled: items[0]?.id === it.id,
          },
          {
            label: "Move down",
            icon: <ArrowDown />,
            onSelect: () => move(it, 1),
            disabled: items[items.length - 1]?.id === it.id,
          },
          {
            label: it.isFeatured ? "Unfeature" : "Feature",
            icon: it.isFeatured ? <StarOff /> : <Star />,
            onSelect: () =>
              run(
                () =>
                  setItemsFlags(row.id, [it.id], {
                    isFeatured: !it.isFeatured,
                  }),
                it.isFeatured ? "Unfeatured" : "Featured",
              ),
          },
          {
            label: it.isVisible ? "Hide" : "Show",
            icon: it.isVisible ? <EyeOff /> : <Eye />,
            onSelect: () =>
              run(
                () =>
                  setItemsFlags(row.id, [it.id], { isVisible: !it.isVisible }),
                it.isVisible ? "Hidden" : "Shown",
              ),
          },
          "separator",
          {
            label: "Delete",
            icon: <Trash2 />,
            danger: true,
            onSelect: async () => {
              const ok = await confirm({
                title: `Delete ${it.title}?`,
                description:
                  "To keep it but take it off the site, hide it instead.",
                confirmLabel: "Delete",
                danger: true,
              });
              if (ok) run(() => deleteItems(row.id, [it.id]), "Deleted");
            },
          },
        ]}
        toolbar={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="subtle"
              onClick={() => setImporting(true)}
            >
              <Upload aria-hidden className="size-4" /> Import CSV
            </Button>
            <Button
              size="sm"
              variant="subtle"
              disabled={items.length === 0}
              onClick={() => exportCsv(row.slug, items, categories)}
            >
              <Download aria-hidden className="size-4" /> Export
            </Button>
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus aria-hidden className="size-4" /> Add design
            </Button>
          </div>
        }
        empty={{
          title: "No designs yet",
          description: "Add designs one by one, or import a spreadsheet.",
          action: (
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus aria-hidden className="size-4" /> Add design
            </Button>
          ),
        }}
      />
      <p className="text-surface-muted text-xs">
        Visitors see designs in this order (featured first) unless they sort by
        price. Use Move up and Move down in a design&apos;s ⋯ menu to change it.
      </p>

      <ItemPanel
        key={editing === "new" ? "new" : (editing?.id ?? "closed")}
        catalogueId={row.id}
        catalogueSlug={row.slug}
        id={editing === "new" ? null : (editing?.id ?? null)}
        initial={
          editing && editing !== "new" ? formOfItem(editing) : EMPTY_ITEM
        }
        isSample={editing !== "new" && !!editing?.isSample}
        categories={categories}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
      {priceIds && (
        <PriceDialog
          catalogueId={row.id}
          items={items.filter((i) => priceIds.includes(i.id))}
          open
          onClose={() => setPriceIds(null)}
          onDone={() => {
            setPriceIds(null);
            router.refresh();
          }}
        />
      )}
      {moveIds && (
        <MoveDialog
          catalogueId={row.id}
          ids={moveIds}
          categories={categories}
          open
          onClose={() => setMoveIds(null)}
          onDone={() => {
            setMoveIds(null);
            router.refresh();
          }}
        />
      )}
      <CsvImportDialog
        catalogueId={row.id}
        catalogueSlug={row.slug}
        open={importing}
        onClose={() => setImporting(false)}
        onDone={() => {
          setImporting(false);
          router.refresh();
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

function CategoriesTab({
  catalogueId,
  categories,
}: {
  catalogueId: string;
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const [list, setList] = useState(categories);
  const [naming, setNaming] = useState<AdminCategory | "new" | null>(null);
  const [removing, setRemoving] = useState<AdminCategory | null>(null);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setList(categories), [categories]);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-surface-muted max-w-xl text-sm">
          The filter chips on the catalogue page and the sliding row in its
          hero, in this order. Empty categories aren&apos;t shown on the site.
        </p>
        <Button size="sm" onClick={() => setNaming("new")}>
          <Plus aria-hidden className="size-4" /> Add category
        </Button>
      </div>
      {list.length === 0 ? (
        <EmptyState
          title="No categories"
          description="Designs without a category are shown under Other."
        />
      ) : (
        <SortableList
          label="Category order"
          items={list}
          getId={(c) => c.id}
          onReorder={(next) => {
            setList(next);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(async () => {
              const res = await reorderCategories(
                catalogueId,
                next.map((c) => c.id),
              );
              if (!res.success) toast.error(res.message);
              else toast.success("Order saved");
            }, 700);
          }}
          renderItem={(c) => (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNaming(c)}
                className="flex min-w-0 flex-1 flex-col gap-0.5 text-left outline-none focus-visible:underline"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">{c.name}</span>
                  {!c.isVisible && <StatusPill>Hidden</StatusPill>}
                </span>
                <span className="text-surface-muted text-xs">
                  {c.itemCount} design{c.itemCount === 1 ? "" : "s"}
                </span>
              </button>
              <RowActions
                label={`Actions for ${c.name}`}
                title={c.name}
                actions={[
                  {
                    label: "Rename",
                    icon: <Pencil />,
                    onSelect: () => setNaming(c),
                  },
                  {
                    label: c.isVisible ? "Hide" : "Show",
                    icon: c.isVisible ? <EyeOff /> : <Eye />,
                    onSelect: () =>
                      run(
                        () =>
                          setCategoryVisible(catalogueId, c.id, !c.isVisible),
                        c.isVisible ? "Hidden, with its designs" : "Shown",
                      ),
                  },
                  "separator",
                  {
                    label: "Delete",
                    icon: <Trash2 />,
                    danger: true,
                    onSelect: () => setRemoving(c),
                  },
                ]}
              />
            </div>
          )}
        />
      )}
      <p className="text-surface-muted text-xs">
        Hiding a category also hides its designs from the site.
      </p>

      {naming && (
        <CategoryNameDialog
          key={naming === "new" ? "new" : naming.id}
          catalogueId={catalogueId}
          category={naming === "new" ? null : naming}
          onClose={() => setNaming(null)}
          onDone={() => {
            setNaming(null);
            router.refresh();
          }}
        />
      )}
      {removing && (
        <DeleteCategoryDialog
          catalogueId={catalogueId}
          category={removing}
          others={categories.filter((c) => c.id !== removing.id)}
          onClose={() => setRemoving(null)}
          onDone={() => {
            setRemoving(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CategoryNameDialog({
  catalogueId,
  category,
  onClose,
  onDone,
}: {
  catalogueId: string;
  category: AdminCategory | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [saving, start] = useTransition();
  const submit = () =>
    start(async () => {
      const res = await saveCategory(catalogueId, category?.id ?? null, name);
      if (!res.success) return void toast.error(res.message);
      toast.success(category ? "Renamed" : "Category added");
      onDone();
    });
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={category ? `Rename ${category.name}` : "Add a category"}
      size="sm"
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || !name.trim() || name === category?.name}
            onClick={submit}
          >
            {saving ? "Saving" : category ? "Rename" : "Add"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) submit();
        }}
      >
        <TextField
          label="Name"
          autoFocus
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Invitation cards"
        />
      </form>
    </Modal>
  );
}

function DeleteCategoryDialog({
  catalogueId,
  category,
  others,
  onClose,
  onDone,
}: {
  catalogueId: string;
  category: AdminCategory;
  others: AdminCategory[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [moveTo, setMoveTo] = useState(others[0]?.id ?? "");
  const [saving, start] = useTransition();
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Delete ${category.name}?`}
      size="sm"
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={saving}
            onClick={() =>
              start(async () => {
                const res = await deleteCategory(
                  catalogueId,
                  category.id,
                  moveTo || null,
                );
                if (!res.success) return void toast.error(res.message);
                toast.success("Category deleted");
                onDone();
              })
            }
          >
            {saving ? "Deleting" : "Delete category"}
          </Button>
        </>
      }
    >
      {category.itemCount > 0 ? (
        <SelectField
          label={`Move its ${category.itemCount} design${category.itemCount === 1 ? "" : "s"} to`}
          value={moveTo}
          onChange={(e) => setMoveTo(e.target.value)}
          options={[
            ...others.map((c) => ({ value: c.id, label: c.name })),
            { value: "", label: "No category (Other)" },
          ]}
        />
      ) : (
        <p className="text-sm">It has no designs.</p>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Price sheet                                                         */
/* ------------------------------------------------------------------ */

type Draft = Record<string, { price: string; moq: string }>;

function PricesTab({
  catalogueId,
  categories,
  items,
}: {
  catalogueId: string;
  categories: AdminCategory[];
  items: AdminItem[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [adjusting, setAdjusting] = useState(false);
  const [saving, start] = useTransition();
  useEffect(() => setDraft({}), [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (it) =>
        (category === "all" ||
          (category === "none"
            ? !it.categoryId
            : it.categoryId === category)) &&
        (!q || it.title.toLowerCase().includes(q)),
    );
  }, [items, query, category]);

  const changes = Object.entries(draft)
    .map(([id, d]) => {
      const it = items.find((i) => i.id === id);
      if (!it) return null;
      const price = Number(d.price.replace(/[,\s₦]/g, ""));
      const moq = Number(d.moq.replace(/[,\s]/g, ""));
      return { id, price, moq, it };
    })
    .filter(
      (c): c is { id: string; price: number; moq: number; it: AdminItem } =>
        !!c && (c.price !== c.it.price || c.moq !== c.it.moq),
    );
  const invalid = changes.some(
    (c) =>
      !Number.isInteger(c.price) ||
      c.price < 0 ||
      !Number.isInteger(c.moq) ||
      c.moq < 1,
  );

  const cell = (it: AdminItem, key: "price" | "moq") =>
    draft[it.id]?.[key] ?? String(it[key]);
  const set = (it: AdminItem, key: "price" | "moq", value: string) =>
    setDraft((d) => ({
      ...d,
      [it.id]: {
        price: d[it.id]?.price ?? String(it.price),
        moq: d[it.id]?.moq ?? String(it.moq),
        [key]: value,
      },
    }));

  const inputCls =
    "border-charcoal/15 focus:border-royal h-10 w-full rounded-[8px] border bg-white px-3 text-right tabular-nums outline-none";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="md:w-72">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search designs"
          />
        </div>
        <div className="md:w-60">
          <SelectField
            label="Category"
            hideLabel
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
              { value: "none", label: "Other" },
            ]}
          />
        </div>
        <Button
          size="sm"
          variant="subtle"
          className="md:ml-auto"
          disabled={shown.length === 0 || changes.length > 0}
          onClick={() => setAdjusting(true)}
        >
          <Tags aria-hidden className="size-4" /> Change all {shown.length}{" "}
          shown
        </Button>
      </div>
      <p className="text-surface-muted -mt-2 text-xs">
        Type new prices (whole naira) and minimum orders, then save them all at
        once.
        {changes.length > 0 &&
          " Save or discard your edits before changing many at once."}
      </p>

      <div className="border-surface-rule overflow-x-auto rounded-[12px] border bg-white">
        <table className="w-full min-w-[34rem] text-sm">
          <caption className="sr-only">Price sheet</caption>
          <thead className="bg-canvas text-surface-muted text-left text-xs">
            <tr>
              <th className="px-4 py-3 font-bold">Design</th>
              <th className="w-40 px-4 py-3 text-right font-bold">Price (₦)</th>
              <th className="w-32 px-4 py-3 text-right font-bold">Minimum</th>
              <th className="hidden w-28 px-4 py-3 font-bold sm:table-cell">
                Unit
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((it) => {
              const changed = changes.some((c) => c.id === it.id);
              return (
                <tr
                  key={it.id}
                  className={`border-surface-rule border-t ${changed ? "bg-ice/40" : ""}`}
                >
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-2">
                      <span className="font-bold">{it.title}</span>
                      {it.isSample && (
                        <StatusPill tone="warning">Sample</StatusPill>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      inputMode="numeric"
                      aria-label={`Price of ${it.title}`}
                      className={inputCls}
                      value={cell(it, "price")}
                      onChange={(e) => set(it, "price", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      inputMode="numeric"
                      aria-label={`Minimum order of ${it.title}`}
                      className={inputCls}
                      value={cell(it, "moq")}
                      onChange={(e) => set(it, "moq", e.target.value)}
                    />
                  </td>
                  <td className="text-surface-muted hidden px-4 py-2 sm:table-cell">
                    {it.unit}
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-surface-muted px-4 py-10 text-center"
                >
                  No designs match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SaveBar
        dirty={changes.length > 0}
        saving={saving}
        message={
          invalid
            ? "Prices and minimums must be whole numbers (minimum at least 1)"
            : `${changes.length} design${changes.length === 1 ? "" : "s"} changed`
        }
        saveLabel={`Save ${changes.length} change${changes.length === 1 ? "" : "s"}`}
        onDiscard={() => setDraft({})}
        onSave={() => {
          if (invalid)
            return void toast.error("Fix the highlighted numbers first.");
          start(async () => {
            const res = await savePrices(
              catalogueId,
              changes.map(({ id, price, moq }) => ({ id, price, moq })),
            );
            if (!res.success) return void toast.error(res.message);
            toast.success(
              `${res.count} price${res.count === 1 ? "" : "s"} saved`,
            );
            setDraft({});
            router.refresh();
          });
        }}
      />
      {adjusting && (
        <PriceDialog
          catalogueId={catalogueId}
          items={shown}
          open
          onClose={() => setAdjusting(false)}
          onDone={() => {
            setAdjusting(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
