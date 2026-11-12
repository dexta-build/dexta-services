"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  schoolPortalFeatureCardSchema,
  schoolPortalSectionContentSchema,
  type SchoolPortalFeatureCardInput,
} from "@/lib/validators";
import { Button } from "@/components/site/button";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { AdminCard, StatusPill } from "@/components/admin/kit/layout";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { Tabs } from "@/components/admin/kit/overlays";
import {
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import { ListEditor, NumberField } from "@/components/admin/kit/inputs";
import { useConfirm } from "@/components/admin/kit/feedback";
import { useUnsavedChangesWarning } from "@/components/admin/kit/save-bar";
import {
  createSchoolPortalFeatureCard,
  deleteSchoolPortalFeatureCard,
  updateSchoolPortalFeatureCard,
  updateSchoolPortalSectionContent,
  type SchoolPortalFeatureCardRow,
  type SchoolPortalSectionContentRow,
} from "../actions";
import { checkForm } from "../_components/form";
import {
  AssetThumb,
  MediaAssetsEditor,
  assetsFromRows,
  assetsToPayload,
  coverAsset,
  type MediaAsset,
} from "../_components/media-assets-editor";

type Card = SchoolPortalFeatureCardRow;
type CardForm = {
  title: string;
  summary: string;
  description: string;
  features: string[];
  isVisible: boolean;
  position: number;
  coverAssetId: string | null;
  assets: MediaAsset[];
};

const toCardForm = (c?: Card, nextPosition = 0): CardForm => ({
  title: c?.title ?? "",
  summary: c?.summary ?? "",
  description: c?.description ?? "",
  features: c?.features ?? [],
  isVisible: c?.isVisible ?? true,
  position: c?.position ?? nextPosition,
  coverAssetId: c?.coverAssetId ?? null,
  assets: assetsFromRows(c?.assets ?? []),
});

const toCardPayload = (f: CardForm): SchoolPortalFeatureCardInput => ({
  title: f.title.trim(),
  summary: f.summary.trim(),
  description: f.description.trim(),
  features: JSON.stringify(f.features.map((x) => x.trim()).filter(Boolean)),
  coverAssetId: f.coverAssetId,
  // The page doesn't show YouTube links; the old admin cleared them too.
  youtubeUrl: null,
  isVisible: f.isVisible,
  position: f.position,
  assets: assetsToPayload(f.assets),
});

type SectionForm = {
  eyebrow: string;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  isVisible: boolean;
};

const toSectionForm = (c: SchoolPortalSectionContentRow): SectionForm => ({
  eyebrow: c.eyebrow,
  title: c.title,
  description: c.description,
  ctaText: c.ctaText ?? "",
  ctaHref: c.ctaHref ?? "",
  isVisible: c.isVisible,
});

function SectionEditor({
  content,
}: {
  content: SchoolPortalSectionContentRow;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => toSectionForm(content));
  const [form, setForm] = useState(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  useUnsavedChangesWarning(dirty);

  const set = <K extends keyof SectionForm>(k: K, v: SectionForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const save = async () => {
    const checked = checkForm(schoolPortalSectionContentSchema, {
      ...form,
      ctaText: form.ctaText.trim() || null,
      ctaHref: form.ctaHref.trim() || null,
    });
    if (!checked.ok) {
      setErrors(checked.errors);
      toast.error(checked.first);
      return;
    }
    setSaving(true);
    const result = await updateSchoolPortalSectionContent(checked.data);
    setSaving(false);
    if (!result.success) return void toast.error(result.message);
    setSaved(form);
    toast.success("Section saved");
    router.refresh();
  };

  return (
    <AdminCard
      title="The section"
      description="The heading and intro above the portal cards."
      actions={
        <>
          {dirty && (
            <Button
              size="sm"
              variant="subtle"
              onClick={() => {
                setForm(saved);
                setErrors({});
              }}
              disabled={saving}
            >
              Discard
            </Button>
          )}
          <Button size="sm" onClick={save} disabled={!dirty || saving}>
            {saving && <Loader2 aria-hidden className="size-4 animate-spin" />}
            Save section
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <SwitchField
          label="Show the portal section"
          description="Turn off to hide the whole section, cards included, from the We Brand Schools page."
          checked={form.isVisible}
          onCheckedChange={(v) => set("isVisible", v)}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Small line above the title"
            value={form.eyebrow}
            maxLength={120}
            onChange={(e) => set("eyebrow", e.target.value)}
            error={errors.eyebrow}
            required
          />
          <TextField
            label="Title"
            value={form.title}
            maxLength={260}
            onChange={(e) => set("title", e.target.value)}
            error={errors.title}
            required
          />
        </div>
        <TextareaField
          label="Intro"
          rows={4}
          maxLength={1600}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          error={errors.description}
          required
        />
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Button text"
            value={form.ctaText}
            maxLength={100}
            onChange={(e) => set("ctaText", e.target.value)}
            placeholder="Optional"
            error={errors.ctaText}
          />
          <TextField
            label="Button link"
            value={form.ctaHref}
            onChange={(e) => set("ctaHref", e.target.value)}
            placeholder="#school-portal"
            error={errors.ctaHref}
          />
        </div>
      </div>
    </AdminCard>
  );
}

export function PortalManager({
  sectionContent,
  cards,
}: {
  sectionContent: SchoolPortalSectionContentRow;
  cards: Card[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<{
    id: string | null;
    form: CardForm;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("details");

  const open = (c?: Card) => {
    setErrors({});
    setTab("details");
    setEditing({
      id: c?.id ?? null,
      form: toCardForm(
        c,
        cards.reduce((n, x) => Math.max(n, x.position + 1), 0),
      ),
    });
  };
  const patch = (p: Partial<CardForm>) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, ...p } } : e));
  const set = <K extends keyof CardForm>(k: K, v: CardForm[K]) => {
    patch({ [k]: v } as Partial<CardForm>);
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const save = async () => {
    if (!editing) return;
    const checked = checkForm(
      schoolPortalFeatureCardSchema,
      toCardPayload(editing.form),
    );
    if (!checked.ok) {
      setErrors(checked.errors);
      setTab(
        Object.keys(checked.errors).some((k) => k.startsWith("assets"))
          ? "media"
          : "details",
      );
      toast.error(checked.first);
      return;
    }
    setSaving(true);
    const result = editing.id
      ? await updateSchoolPortalFeatureCard(editing.id, checked.data)
      : await createSchoolPortalFeatureCard(checked.data);
    setSaving(false);
    if (!result.success) return void toast.error(result.message);
    toast.success(editing.id ? "Card saved" : "Card added");
    setEditing(null);
    router.refresh();
  };

  const toggleVisible = async (c: Card) => {
    const result = await updateSchoolPortalFeatureCard(
      c.id,
      toCardPayload({ ...toCardForm(c), isVisible: !c.isVisible }),
    );
    if (!result.success) return void toast.error(result.message);
    toast.success(c.isVisible ? "Card hidden" : "Card shown");
    router.refresh();
  };

  const remove = async (c: Card) => {
    const ok = await confirm({
      title: `Delete “${c.title}”?`,
      description:
        "The card and its media list are removed. This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteSchoolPortalFeatureCard(c.id);
    if (!result.success) return void toast.error(result.message);
    toast.success("Card deleted");
    router.refresh();
  };

  const removeMany = async (ids: string[]) => {
    const ok = await confirm({
      title: `Delete ${ids.length} card${ids.length === 1 ? "" : "s"}?`,
      description: "This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    let failed = 0;
    for (const id of ids) {
      const r = await deleteSchoolPortalFeatureCard(id);
      if (!r.success) failed++;
    }
    if (failed) toast.error(`${failed} couldn't be deleted.`);
    else
      toast.success(`Deleted ${ids.length} card${ids.length === 1 ? "" : "s"}`);
    router.refresh();
  };

  const columns: Column<Card>[] = [
    {
      key: "card",
      header: "Card",
      primary: true,
      sortValue: (c) => c.title.toLowerCase(),
      cell: (c) => (
        <span className="flex min-w-0 items-center gap-3">
          <AssetThumb
            asset={coverAsset(c.assets, c.coverAssetId)}
            fallback={<LayoutGrid />}
          />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-bold">{c.title}</span>
            <span className="text-surface-muted line-clamp-1 text-xs">
              {c.summary}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "On the page",
      sortValue: (c) => (c.isVisible ? 0 : 1),
      cell: (c) =>
        c.isVisible ? (
          <StatusPill tone="success" dot>
            Shown
          </StatusPill>
        ) : (
          <StatusPill>Hidden</StatusPill>
        ),
    },
    {
      key: "features",
      header: "Features",
      hideBelow: "lg",
      sortValue: (c) => c.features.length,
      cell: (c) => (
        <span className="text-surface-muted text-sm tabular-nums">
          {c.features.length}
        </span>
      ),
    },
    {
      key: "media",
      header: "Media",
      hideBelow: "lg",
      sortValue: (c) => c.assets.length,
      cell: (c) => (
        <span className="text-surface-muted text-sm tabular-nums">
          {c.assets.length}
        </span>
      ),
    },
    {
      key: "order",
      header: "Order",
      sortValue: (c) => c.position,
      cell: (c) => <span className="tabular-nums">{c.position}</span>,
    },
  ];

  const f = editing?.form;

  return (
    <div className="flex flex-col gap-8">
      <SectionEditor content={sectionContent} />

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold">Portal cards</h2>
          <p className="text-surface-muted text-sm">
            Each card opens a window with its description, features and
            screenshots or videos.
          </p>
        </div>
        <DataTable
          label="Portal cards"
          rows={cards}
          columns={columns}
          getRowId={(c) => c.id}
          rowLabel={(c) => c.title}
          onRowClick={(c) => open(c)}
          searchText={(c) => `${c.title} ${c.summary}`}
          searchPlaceholder="Search cards"
          rowActions={(c) => [
            { label: "Edit", icon: <Pencil />, onSelect: () => open(c) },
            {
              label: c.isVisible ? "Hide" : "Show",
              icon: c.isVisible ? <EyeOff /> : <Eye />,
              onSelect: () => void toggleVisible(c),
            },
            "separator",
            {
              label: "Delete",
              icon: <Trash2 />,
              danger: true,
              onSelect: () => void remove(c),
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
              <Plus aria-hidden className="size-4" /> Add card
            </Button>
          }
          empty={{
            icon: <LayoutGrid />,
            title: "No portal cards yet",
            description:
              "Add a card for each part of the free school portal: results, fees, attendance…",
            action: (
              <Button size="sm" onClick={() => open()}>
                <Plus aria-hidden className="size-4" /> Add card
              </Button>
            ),
          }}
        />
      </section>

      <SidePanel
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        width="xl"
        title={editing?.id ? f?.title || "Edit card" : "New portal card"}
        description="Shown in the free portal section of the We Brand Schools page."
        footer={
          <>
            <Button size="sm" variant="subtle" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing?.id ? "Save" : "Add card"}
            </Button>
          </>
        }
      >
        {f && (
          <Tabs
            label="Portal card"
            value={tab}
            onValueChange={setTab}
            tabs={[
              {
                value: "details",
                label: "Details",
                content: (
                  <div className="flex flex-col gap-5">
                    <TextField
                      label="Title"
                      value={f.title}
                      maxLength={160}
                      onChange={(e) => set("title", e.target.value)}
                      error={errors.title}
                      required
                    />
                    <TextareaField
                      label="Summary"
                      rows={3}
                      maxLength={260}
                      value={f.summary}
                      onChange={(e) => set("summary", e.target.value)}
                      hint="On the card itself."
                      error={errors.summary}
                      required
                    />
                    <TextareaField
                      label="Description"
                      rows={6}
                      maxLength={4000}
                      value={f.description}
                      onChange={(e) => set("description", e.target.value)}
                      hint="In the window that opens from the card."
                      error={errors.description}
                      required
                    />
                    <ListEditor
                      label="Features"
                      value={f.features}
                      onChange={(v) => set("features", v)}
                      placeholder="e.g. Parents see results online"
                      addLabel="Add feature"
                      max={12}
                      hint={
                        errors.features ??
                        "Up to 12, 140 characters each. Drag to reorder."
                      }
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <NumberField
                        label="Order"
                        value={f.position}
                        min={0}
                        onChange={(v) => set("position", v ?? 0)}
                        hint="Lower numbers come first."
                        error={errors.position}
                      />
                    </div>
                    <SwitchField
                      label="Show on the page"
                      checked={f.isVisible}
                      onCheckedChange={(v) => set("isVisible", v)}
                    />
                  </div>
                ),
              },
              {
                value: "media",
                label: "Screenshots & videos",
                badge: f.assets.length,
                content: (
                  <MediaAssetsEditor
                    assets={f.assets}
                    coverId={f.coverAssetId}
                    onChange={(assets, coverAssetId) =>
                      patch({ assets, coverAssetId })
                    }
                    errors={errors}
                    intro="Shown in the card's window. Drag to set the order; the starred one is the card's cover. Videos need a cover image."
                    emptyText="Add a screenshot so the card has a picture."
                  />
                ),
              },
            ]}
          />
        )}
      </SidePanel>
    </div>
  );
}
