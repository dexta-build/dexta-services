"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import type { AdminCategory } from "@/lib/thoughts/admin";
import { slugify } from "@/lib/slugify";
import { Button } from "@/components/site/button";
import { EmptyState } from "@/components/admin/kit/layout";
import { SortableList } from "@/components/admin/kit/sortable-list";
import { RowActions } from "@/components/admin/kit/row-actions";
import { Modal } from "@/components/admin/kit/overlays";
import {
  SelectField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import { useConfirm } from "@/components/admin/kit/feedback";
import { deleteCategory, reorderCategories, saveCategory } from "../actions";

const COLORS = [
  { value: "ice", label: "Ice blue" },
  { value: "mint", label: "Mint" },
  { value: "gold", label: "Gold" },
  { value: "lilac", label: "Lilac" },
  { value: "coral", label: "Coral" },
  { value: "stone", label: "Stone" },
];

type Form = { name: string; slug: string; description: string; color: string };

export function CategoriesManager({
  categories,
}: {
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [list, setList] = useState(categories);
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setList(categories), [categories]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus aria-hidden className="size-4" /> Add category
        </Button>
      </div>
      {list.length === 0 ? (
        <EmptyState
          title="No categories"
          description="Articles without a category still show on the Thoughts page."
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
              const res = await reorderCategories(next.map((c) => c.id));
              if (!res.success) toast.error(res.message);
              else toast.success("Order saved");
            }, 700);
          }}
          renderItem={(c) => (
            <div className="flex items-center gap-3">
              <span
                data-surface={c.color}
                aria-hidden
                className="bg-surface size-10 shrink-0 rounded-[10px]"
              />
              <button
                type="button"
                onClick={() => setEditing(c)}
                className="flex min-w-0 flex-1 flex-col gap-0.5 text-left outline-none focus-visible:underline"
              >
                <span className="text-sm font-bold">{c.name}</span>
                <span className="text-surface-muted truncate text-xs">
                  {c.postCount} article{c.postCount === 1 ? "" : "s"} ·{" "}
                  {c.description || `/thoughts/category/${c.slug}`}
                </span>
              </button>
              <RowActions
                label={`Actions for ${c.name}`}
                title={c.name}
                actions={[
                  {
                    label: "Edit",
                    icon: <Pencil />,
                    onSelect: () => setEditing(c),
                  },
                  {
                    label: "View on site",
                    icon: <ExternalLink />,
                    href: `/thoughts/category/${c.slug}`,
                    external: true,
                    hidden: c.postCount === 0,
                  },
                  "separator",
                  {
                    label: "Delete",
                    icon: <Trash2 />,
                    danger: true,
                    onSelect: async () => {
                      const ok = await confirm({
                        title: `Delete ${c.name}?`,
                        description:
                          c.postCount > 0
                            ? `Its ${c.postCount} article${c.postCount === 1 ? "" : "s"} stay, without a category.`
                            : "It has no articles.",
                        confirmLabel: "Delete",
                        danger: true,
                      });
                      if (ok)
                        start(async () => {
                          const res = await deleteCategory(c.id);
                          if (!res.success)
                            return void toast.error(res.message);
                          toast.success("Category deleted");
                          router.refresh();
                        });
                    },
                  },
                ]}
              />
            </div>
          )}
        />
      )}
      {editing && (
        <CategoryDialog
          key={editing === "new" ? "new" : editing.id}
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CategoryDialog({
  category,
  onClose,
  onDone,
}: {
  category: AdminCategory | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState<Form>({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    color: category?.color ?? "ice",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, start] = useTransition();
  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={category ? `Edit ${category.name}` : "Add a category"}
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || !form.name.trim()}
            onClick={() =>
              start(async () => {
                const res = await saveCategory(category?.id ?? null, form);
                if (!res.success) {
                  setErrors(res.errors ?? {});
                  return void toast.error(res.message);
                }
                toast.success(category ? "Category saved" : "Category added");
                onDone();
              })
            }
          >
            {saving ? "Saving" : category ? "Save" : "Add"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Name"
          required
          autoFocus
          maxLength={40}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
        />
        <TextField
          label="Page address"
          maxLength={60}
          value={form.slug}
          onChange={(e) => set("slug", e.target.value)}
          placeholder={slugify(form.name) || "brand-design"}
          hint={`/thoughts/category/${form.slug || slugify(form.name) || "…"}. Leave empty to use the name.`}
          error={errors.slug}
        />
        <TextareaField
          label="Description"
          rows={2}
          maxLength={200}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          hint="Under the heading of its page."
        />
        <SelectField
          label="Colour"
          value={form.color}
          onChange={(e) => set("color", e.target.value)}
          options={COLORS}
          hint="Its page, the article sidebar card and the category tag."
        />
        <div
          data-surface={form.color}
          className="dx-site bg-surface text-surface-fg rounded-[10px] p-5"
        >
          <p className="text-eyebrow text-surface-muted">Preview</p>
          <p className="dx-heading text-h3 mt-1">
            <em>{form.name || "Category"}</em>
          </p>
        </div>
      </div>
    </Modal>
  );
}
