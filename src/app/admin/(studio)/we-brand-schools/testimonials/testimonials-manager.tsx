"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Pencil, Plus, Quote, Trash2 } from "lucide-react";
import { stock } from "@/lib/site/stock-media";
import {
  SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_NAME_CHARACTERS,
  SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_POSITION_CHARACTERS,
  SCHOOL_WEBSITE_TESTIMONIAL_MAX_CHARACTERS,
  SCHOOL_WEBSITE_TESTIMONIAL_MAX_SCHOOL_NAME_CHARACTERS,
  schoolWebsiteTestimonialSchema,
  type SchoolWebsiteTestimonialInput,
} from "@/lib/validators";
import { Button } from "@/components/site/button";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { StatusPill } from "@/components/admin/kit/layout";
import { SidePanel } from "@/components/admin/kit/side-panel";
import {
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import { NumberField } from "@/components/admin/kit/inputs";
import { useConfirm } from "@/components/admin/kit/feedback";
import { MediaValueField } from "@/components/admin/content/media-value-field";
import {
  createSchoolWebsiteTestimonial,
  deleteSchoolWebsiteTestimonial,
  deleteSchoolWebsiteTestimonials,
  updateSchoolWebsiteTestimonial,
  type SchoolWebsiteTestimonialRow,
} from "../actions";
import { checkForm } from "../_components/form";

type Row = SchoolWebsiteTestimonialRow;

const blank = (position: number): SchoolWebsiteTestimonialInput => ({
  schoolName: "",
  logoPublicId: null,
  quote: "",
  authorName: "",
  authorPosition: "",
  isVisible: true,
  position,
});

const initials = (v: string) =>
  v
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

function Logo({ row }: { row: Pick<Row, "logoPublicId" | "schoolName"> }) {
  const [broken, setBroken] = useState(false);
  return row.logoPublicId && !broken ? (
    // eslint-disable-next-line @next/next/no-img-element -- logos from the media library
    <img
      src={stock(row.logoPublicId, 120)}
      alt=""
      onError={() => setBroken(true)}
      className="size-10 shrink-0 rounded-full bg-white object-contain ring-1 ring-black/[0.08]"
    />
  ) : (
    <span
      aria-hidden
      className="bg-ice text-royal inline-flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
    >
      {initials(row.schoolName) || "?"}
    </span>
  );
}

export function TestimonialsManager({ testimonials }: { testimonials: Row[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<{
    id: string | null;
    form: SchoolWebsiteTestimonialInput;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const open = (row?: Row) => {
    setErrors({});
    setEditing(
      row
        ? {
            id: row.id,
            form: {
              schoolName: row.schoolName,
              logoPublicId: row.logoPublicId ?? null,
              quote: row.quote,
              authorName: row.authorName,
              authorPosition: row.authorPosition,
              isVisible: row.isVisible,
              position: row.position,
            },
          }
        : {
            id: null,
            form: blank(
              testimonials.reduce((n, t) => Math.max(n, t.position + 1), 0),
            ),
          },
    );
  };

  const set = <K extends keyof SchoolWebsiteTestimonialInput>(
    k: K,
    v: SchoolWebsiteTestimonialInput[K],
  ) => {
    setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const save = async () => {
    if (!editing) return;
    const checked = checkForm(schoolWebsiteTestimonialSchema, editing.form);
    if (!checked.ok) {
      setErrors(checked.errors);
      toast.error(checked.first);
      return;
    }
    setSaving(true);
    const result = editing.id
      ? await updateSchoolWebsiteTestimonial(editing.id, checked.data)
      : await createSchoolWebsiteTestimonial(checked.data);
    setSaving(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(editing.id ? "Testimonial saved" : "Testimonial added");
    setEditing(null);
    router.refresh();
  };

  const toggleVisible = async (row: Row) => {
    const result = await updateSchoolWebsiteTestimonial(row.id, {
      schoolName: row.schoolName,
      logoPublicId: row.logoPublicId ?? null,
      quote: row.quote,
      authorName: row.authorName,
      authorPosition: row.authorPosition,
      position: row.position,
      isVisible: !row.isVisible,
    });
    if (!result.success) return void toast.error(result.message);
    toast.success(row.isVisible ? "Hidden from the page" : "Shown on the page");
    router.refresh();
  };

  const remove = async (row: Row) => {
    const ok = await confirm({
      title: `Delete ${row.schoolName}'s testimonial?`,
      description: "It's removed from the page. This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteSchoolWebsiteTestimonial(row.id);
    if (!result.success) return void toast.error(result.message);
    toast.success("Testimonial deleted");
    router.refresh();
  };

  const removeMany = async (ids: string[]) => {
    const ok = await confirm({
      title: `Delete ${ids.length} testimonial${ids.length === 1 ? "" : "s"}?`,
      description: "They're removed from the page. This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteSchoolWebsiteTestimonials(ids);
    if (!result.success) return void toast.error(result.message);
    toast.success(result.message);
    router.refresh();
  };

  const columns: Column<Row>[] = [
    {
      key: "school",
      header: "School",
      primary: true,
      sortValue: (r) => r.schoolName.toLowerCase(),
      cell: (r) => (
        <span className="flex min-w-0 items-center gap-3">
          <Logo row={r} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-bold">{r.schoolName}</span>
            <span className="text-surface-muted truncate text-xs">
              {r.authorName}, {r.authorPosition}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "quote",
      header: "Write-up",
      hideBelow: "lg",
      cell: (r) => (
        <span className="text-surface-muted line-clamp-2 max-w-md text-sm">
          {r.quote}
        </span>
      ),
    },
    {
      key: "status",
      header: "On the page",
      sortValue: (r) => (r.isVisible ? 0 : 1),
      cell: (r) =>
        r.isVisible ? (
          <StatusPill tone="success" dot>
            Shown
          </StatusPill>
        ) : (
          <StatusPill>Hidden</StatusPill>
        ),
    },
    {
      key: "order",
      header: "Order",
      sortValue: (r) => r.position,
      cell: (r) => <span className="tabular-nums">{r.position}</span>,
    },
  ];

  const form = editing?.form;
  const len = (v: string, max: number) => `${v.trim().length}/${max}`;

  return (
    <>
      <DataTable
        label="Testimonials"
        rows={testimonials}
        columns={columns}
        getRowId={(r) => r.id}
        rowLabel={(r) => r.schoolName}
        onRowClick={(r) => open(r)}
        searchText={(r) =>
          `${r.schoolName} ${r.authorName} ${r.authorPosition} ${r.quote}`
        }
        searchPlaceholder="Search schools or names"
        filters={[
          {
            key: "visible",
            label: "On the page",
            options: [
              { value: "shown", label: "Shown" },
              { value: "hidden", label: "Hidden" },
            ],
            match: (r, v) => (v === "shown" ? r.isVisible : !r.isVisible),
          },
        ]}
        rowActions={(r) => [
          { label: "Edit", icon: <Pencil />, onSelect: () => open(r) },
          {
            label: r.isVisible ? "Hide from the page" : "Show on the page",
            icon: r.isVisible ? <EyeOff /> : <Eye />,
            onSelect: () => void toggleVisible(r),
          },
          "separator",
          {
            label: "Delete",
            icon: <Trash2 />,
            danger: true,
            onSelect: () => void remove(r),
          },
        ]}
        bulkActions={[
          {
            label: "Delete",
            icon: <Trash2 />,
            danger: true,
            onClick: removeMany,
          },
        ]}
        toolbar={
          <Button size="sm" onClick={() => open()}>
            <Plus aria-hidden className="size-4" /> Add testimonial
          </Button>
        }
        empty={{
          icon: <Quote />,
          title: "No testimonials yet",
          description:
            "Add a school's logo, what they said and who said it. Cards scroll across the We Brand Schools page.",
          action: (
            <Button size="sm" onClick={() => open()}>
              <Plus aria-hidden className="size-4" /> Add testimonial
            </Button>
          ),
        }}
      />

      <SidePanel
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing?.id ? "Edit testimonial" : "New testimonial"}
        description="Shown as a card in the moving testimonials on the We Brand Schools page."
        footer={
          <>
            <Button size="sm" variant="subtle" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing?.id ? "Save" : "Add testimonial"}
            </Button>
          </>
        }
      >
        {form && (
          <div className="flex flex-col gap-5">
            <MediaValueField
              label="School logo"
              value={form.logoPublicId ?? ""}
              onChange={(v) => set("logoPublicId", v || null)}
              optional
              hint="Shown on the left of the card. Without one, the school's initials are used."
              error={errors.logoPublicId}
            />
            <TextField
              label="School name"
              value={form.schoolName}
              maxLength={SCHOOL_WEBSITE_TESTIMONIAL_MAX_SCHOOL_NAME_CHARACTERS}
              onChange={(e) => set("schoolName", e.target.value)}
              error={errors.schoolName}
              required
            />
            <TextareaField
              label="What they said"
              rows={5}
              value={form.quote}
              maxLength={SCHOOL_WEBSITE_TESTIMONIAL_MAX_CHARACTERS}
              onChange={(e) => set("quote", e.target.value)}
              hint={`Up to ${SCHOOL_WEBSITE_TESTIMONIAL_MAX_CHARACTERS} characters, so every line fits on the card (${len(form.quote, SCHOOL_WEBSITE_TESTIMONIAL_MAX_CHARACTERS)}).`}
              error={errors.quote}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Their name"
                value={form.authorName}
                maxLength={
                  SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_NAME_CHARACTERS
                }
                onChange={(e) => set("authorName", e.target.value)}
                error={errors.authorName}
                required
              />
              <TextField
                label="Role at the school"
                value={form.authorPosition}
                maxLength={
                  SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_POSITION_CHARACTERS
                }
                onChange={(e) => set("authorPosition", e.target.value)}
                placeholder="Head teacher"
                error={errors.authorPosition}
                required
              />
            </div>
            <NumberField
              label="Order"
              value={form.position}
              min={0}
              onChange={(v) => set("position", v ?? 0)}
              hint="Lower numbers come first."
              error={errors.position}
            />
            <SwitchField
              label="Show on the page"
              description="Turn off to hide the card without deleting it."
              checked={form.isVisible}
              onCheckedChange={(v) => set("isVisible", v)}
            />
          </div>
        )}
      </SidePanel>
    </>
  );
}
