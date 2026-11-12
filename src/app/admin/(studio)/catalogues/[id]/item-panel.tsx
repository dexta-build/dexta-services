"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { AdminCategory } from "@/lib/catalogue/admin";
import type { ItemForm } from "@/lib/catalogue/fields";
import { Button } from "@/components/site/button";
import {
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import {
  NumberField,
  SlugField,
  TagInput,
} from "@/components/admin/kit/inputs";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { Callout } from "@/components/admin/kit/display";
import { useConfirm } from "@/components/admin/kit/feedback";
import { useUnsavedChangesWarning } from "@/components/admin/kit/save-bar";
import { GalleryField } from "@/components/admin/content/section-form";
import { saveItem } from "../actions";

export const EMPTY_ITEM: ItemForm = {
  title: "",
  slug: "",
  description: "",
  categoryId: "",
  price: 0,
  moq: 1,
  unit: "piece",
  tags: [],
  media: [],
  isFeatured: false,
  isVisible: true,
};

/** Add or edit one design: images/videos, price, MOQ, unit, tags, flags. */
export function ItemPanel({
  catalogueId,
  catalogueSlug,
  id,
  initial,
  isSample,
  categories,
  open,
  onClose,
  onSaved,
}: {
  catalogueId: string;
  catalogueSlug: string;
  id: string | null;
  initial: ItemForm;
  isSample?: boolean;
  categories: AdminCategory[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ItemForm>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, start] = useTransition();
  const confirm = useConfirm();
  const dirty = open && JSON.stringify(form) !== JSON.stringify(initial);
  useUnsavedChangesWarning(dirty);
  const set = <K extends keyof ItemForm>(k: K, v: ItemForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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
      title={id ? initial.title : "Add a design"}
      description="Everything shown on its card and in the order panel."
      width="xl"
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={() => void close()}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || (!dirty && !isSample)}
            onClick={() =>
              start(async () => {
                const res = await saveItem(catalogueId, id, form);
                if (!res.success) {
                  setErrors(res.errors ?? {});
                  return void toast.error(res.message);
                }
                toast.success(id ? "Design saved" : "Design added");
                onSaved();
              })
            }
          >
            {saving ? "Saving" : id ? "Save" : "Add design"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {isSample && (
          <Callout tone="warning" title="Sample design">
            Its price is a placeholder. Saving it, even unchanged, marks it as
            one of your real designs.
          </Callout>
        )}
        <GalleryField
          label="Images and videos"
          value={form.media}
          onChange={(v) => set("media", v)}
          max={20}
          videos
          hint="The first one is the card image. Add as many angles as you like."
          error={errors.media}
        />
        <TextField
          label="Name"
          required
          maxLength={120}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          error={errors.title}
        />
        <SlugField
          basePath={`/catalogue/${catalogueSlug}/`}
          value={form.slug}
          source={form.title}
          onChange={(v) => set("slug", v)}
          error={errors.slug}
        />
        <SelectField
          label="Category"
          value={form.categoryId}
          onChange={(e) => set("categoryId", e.target.value)}
          options={[
            { value: "", label: "No category (shown under Other)" },
            ...categories.map((c) => ({
              value: c.id,
              label: c.isVisible ? c.name : `${c.name} (hidden)`,
            })),
          ]}
          hint="Add or rename categories in the Categories tab."
        />
        <TextareaField
          label="Description"
          rows={3}
          maxLength={600}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          hint="Paper, size, finish, what's included."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Price per unit"
            prefix="₦"
            min={0}
            value={form.price}
            onChange={(v) => set("price", Math.round(v ?? 0))}
            error={errors.price}
            required
          />
          <NumberField
            label="Minimum order"
            min={1}
            value={form.moq}
            onChange={(v) => set("moq", Math.max(1, Math.round(v ?? 1)))}
            error={errors.moq}
            required
          />
          <TextField
            label="Unit"
            maxLength={40}
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
            placeholder="card, piece, pack of 50"
            error={errors.unit}
          />
        </div>
        <p className="text-surface-muted -mt-3 text-xs">
          In naira. Visitors can see it in dollars, euros or pounds too.
          Example: ₦{(form.price || 0).toLocaleString("en-NG")} per{" "}
          {form.unit || "piece"}, minimum {form.moq}.
        </p>
        <TagInput
          label="Tags"
          value={form.tags}
          onChange={(v) => set("tags", v)}
          max={12}
          hint="Short details shown in the order panel, e.g. Foil, Premium."
        />
        <div className="flex flex-col gap-4">
          <SwitchField
            label="Featured"
            description="Shows first when visitors sort by Featured."
            checked={form.isFeatured}
            onCheckedChange={(v) => set("isFeatured", v)}
          />
          <SwitchField
            label="Show on the site"
            description="Hidden designs stay here but leave the catalogue."
            checked={form.isVisible}
            onCheckedChange={(v) => set("isVisible", v)}
          />
        </div>
      </div>
    </SidePanel>
  );
}
