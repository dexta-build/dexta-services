"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CATALOGUE_FIELDS, type CatalogueForm } from "@/lib/catalogue/fields";
import { Button } from "@/components/site/button";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { Callout } from "@/components/admin/kit/display";
import { useConfirm } from "@/components/admin/kit/feedback";
import { useUnsavedChangesWarning } from "@/components/admin/kit/save-bar";
import { SectionForm } from "@/components/admin/content/section-form";
import { saveCatalogue } from "./actions";

export const EMPTY_CATALOGUE: CatalogueForm = {
  title: "",
  slug: "",
  description: "",
  color: "ice",
  icon: "heart",
  cover: "",
  heroTitle: "",
  heroText: "",
  isFeatured: false,
  showOnHome: true,
  isVisible: true,
};

/** Add or edit a catalogue's details (name, colour, hero, image, menus). */
export function CataloguePanel({
  id,
  initial,
  open,
  onClose,
  onSaved,
}: {
  id: string | null;
  initial: CatalogueForm;
  open: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [form, setForm] = useState<CatalogueForm>(initial);
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
      title={id ? initial.title : "Add a catalogue"}
      description="Its page, menu entry, card and homepage tab."
      width="lg"
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
                const res = await saveCatalogue(id, form);
                if (!res.success) {
                  setErrors(res.errors ?? {});
                  return void toast.error(res.message);
                }
                toast.success(id ? "Catalogue saved" : "Catalogue added");
                onSaved(res.id);
              })
            }
          >
            {saving ? "Saving" : id ? "Save" : "Add catalogue"}
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
          fields={CATALOGUE_FIELDS}
          value={form as unknown as Record<string, unknown>}
          onChange={(v) => setForm(v as unknown as CatalogueForm)}
          errors={errors}
        />
      </div>
    </SidePanel>
  );
}
