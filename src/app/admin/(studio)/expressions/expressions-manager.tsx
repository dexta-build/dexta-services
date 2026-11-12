"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { stock } from "@/lib/site/stock-media";
import { EXPRESSION_FIELDS } from "@/lib/site/expression-fields";
import { Button } from "@/components/site/button";
import { StatusPill } from "@/components/admin/kit/layout";
import { SortableList } from "@/components/admin/kit/sortable-list";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { RowActions } from "@/components/admin/kit/row-actions";
import { Callout } from "@/components/admin/kit/display";
import { useConfirm } from "@/components/admin/kit/feedback";
import { useUnsavedChangesWarning } from "@/components/admin/kit/save-bar";
import { SectionForm } from "@/components/admin/content/section-form";
import {
  deleteExpression,
  reorderExpressions,
  saveExpression,
  setExpressionVisible,
  type ExpressionForm,
} from "./actions";

type Product = { id: string; form: ExpressionForm };
type Result = { success: boolean; message?: string };

const EMPTY: ExpressionForm = {
  name: "",
  slug: "",
  tagline: "",
  category: "",
  description: "",
  websiteUrl: "",
  color: "brand",
  logo: "",
  cover: "",
  mobile: "",
  gallery: [],
  facts: [],
  features: [],
  story: [],
  isVisible: true,
};

export function ExpressionsManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [items, setItems] = useState(products);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setItems(products), [products]);

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
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus aria-hidden className="size-4" /> Add product
        </Button>
      </div>
      <SortableList
        label="Our Expressions order"
        items={items}
        getId={(p) => p.id}
        onReorder={(next) => {
          setItems(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(async () => {
            const res = await reorderExpressions(next.map((p) => p.id));
            if (!res.success) toast.error(res.message);
            else toast.success("Order saved");
          }, 700);
        }}
        renderItem={(p) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(p)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:underline"
            >
              {p.form.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- previews from any host
                <img
                  src={stock(p.form.logo, 96, 96)}
                  alt=""
                  className="bg-canvas size-12 shrink-0 rounded-[10px] object-contain p-1.5"
                />
              ) : (
                <span className="bg-ice text-royal inline-flex size-12 shrink-0 items-center justify-center rounded-[10px]">
                  <Sparkles aria-hidden className="size-5" />
                </span>
              )}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">{p.form.name}</span>
                  {!p.form.isVisible && <StatusPill>Hidden</StatusPill>}
                </span>
                <span className="text-surface-muted truncate text-xs">
                  {p.form.category || "No category"} · /expressions/
                  {p.form.slug}
                </span>
              </span>
            </button>
            <RowActions
              label={`Actions for ${p.form.name}`}
              title={p.form.name}
              actions={[
                {
                  label: "Edit",
                  icon: <Pencil />,
                  onSelect: () => setEditing(p),
                },
                {
                  label: "View on site",
                  icon: <ExternalLink />,
                  href: `/expressions/${p.form.slug}`,
                  external: true,
                  hidden: !p.form.isVisible,
                },
                {
                  label: p.form.isVisible ? "Hide" : "Show",
                  icon: p.form.isVisible ? <EyeOff /> : <Eye />,
                  onSelect: () =>
                    run(
                      () => setExpressionVisible(p.id, !p.form.isVisible),
                      p.form.isVisible ? "Hidden" : "Shown",
                    ),
                },
                "separator",
                {
                  label: "Delete",
                  icon: <Trash2 />,
                  danger: true,
                  onSelect: async () => {
                    const ok = await confirm({
                      title: `Delete ${p.form.name}?`,
                      description:
                        "Its product page and logo leave the site. To keep it but take it off the site, hide it instead.",
                      danger: true,
                    });
                    if (ok)
                      run(() => deleteExpression(p.id), "Product deleted");
                  },
                },
              ]}
            />
          </div>
        )}
      />

      <ProductPanel
        key={editing === "new" ? "new" : (editing?.id ?? "closed")}
        product={editing === "new" ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function ProductPanel({
  product,
  open,
  onClose,
  onSaved,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = product?.form ?? EMPTY;
  const [form, setForm] = useState<ExpressionForm>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, start] = useTransition();
  const confirm = useConfirm();
  const dirty = open && JSON.stringify(form) !== JSON.stringify(initial);
  useUnsavedChangesWarning(dirty);

  const close = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Close without saving?",
        description: "Your changes will be lost.",
        confirmLabel: "Close",
        danger: true,
      }))
    )
      return;
    onClose();
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={(o) => !o && void close()}
      title={product ? product.form.name : "Add a product"}
      description="Everything shown on its panel and product page."
      width="xl"
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={() => void close()}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || !dirty}
            onClick={() =>
              start(async () => {
                const res = await saveExpression(product?.id ?? null, form);
                if (!res.success) {
                  setErrors("errors" in res && res.errors ? res.errors : {});
                  return void toast.error(res.message);
                }
                toast.success(product ? "Product saved" : "Product added");
                onSaved();
              })
            }
          >
            {saving ? "Saving" : product ? "Save" : "Add product"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {Object.keys(errors).length > 0 && (
          <Callout tone="danger" title="Some fields need attention">
            They&apos;re marked in red below.
          </Callout>
        )}
        <SectionForm
          fields={EXPRESSION_FIELDS}
          value={form as unknown as Record<string, unknown>}
          onChange={(v) => setForm(v as unknown as ExpressionForm)}
          errors={errors}
        />
      </div>
    </SidePanel>
  );
}
