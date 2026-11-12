"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLink,
  Eye,
  EyeOff,
  LayoutTemplate,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  schoolWebsiteTemplateSchema,
  type SchoolWebsiteTemplateInput,
} from "@/lib/validators";
import { Button } from "@/components/site/button";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { StatusPill } from "@/components/admin/kit/layout";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { Tabs } from "@/components/admin/kit/overlays";
import {
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import {
  ListEditor,
  NumberField,
  SlugField,
} from "@/components/admin/kit/inputs";
import { useConfirm } from "@/components/admin/kit/feedback";
import {
  createSchoolWebsiteTemplate,
  deleteSchoolWebsiteTemplate,
  deleteSchoolWebsiteTemplates,
  updateSchoolWebsiteTemplate,
  type SchoolWebsiteTemplateRow,
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

type Row = SchoolWebsiteTemplateRow;
type Asset = MediaAsset;
type Form = {
  name: string;
  slug: string;
  summary: string;
  description: string;
  websiteUrl: string;
  highlights: string[];
  isVisible: boolean;
  position: number;
  coverAssetId: string | null;
  assets: Asset[];
};

function toForm(t?: Row, nextPosition = 0): Form {
  return {
    name: t?.name ?? "",
    slug: t?.slug ?? "",
    summary: t?.summary ?? "",
    description: t?.description ?? "",
    websiteUrl: t?.websiteUrl ?? "",
    highlights: t?.highlights ?? [],
    isVisible: t?.isVisible ?? true,
    position: t?.position ?? nextPosition,
    coverAssetId: t?.coverAssetId ?? null,
    assets: assetsFromRows(t?.assets ?? []),
  };
}

function toPayload(f: Form): SchoolWebsiteTemplateInput {
  return {
    name: f.name.trim(),
    slug: f.slug.trim(),
    summary: f.summary.trim(),
    description: f.description.trim() || null,
    websiteUrl: f.websiteUrl.trim() || null,
    highlights: JSON.stringify(
      f.highlights.map((h) => h.trim()).filter(Boolean),
    ),
    coverAssetId: f.coverAssetId,
    isVisible: f.isVisible,
    position: f.position,
    assets: assetsToPayload(f.assets),
  };
}

function Thumb({ t }: { t: Row }) {
  return (
    <AssetThumb
      asset={coverAsset(t.assets, t.coverAssetId)}
      fallback={<LayoutTemplate />}
    />
  );
}

export function TemplatesManager({ templates }: { templates: Row[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<{
    id: string | null;
    form: Form;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("details");

  const open = (t?: Row) => {
    setErrors({});
    setTab("details");
    setEditing({
      id: t?.id ?? null,
      form: toForm(
        t,
        templates.reduce((n, x) => Math.max(n, x.position + 1), 0),
      ),
    });
  };

  const patch = (p: Partial<Form>) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, ...p } } : e));
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    patch({ [k]: v } as Partial<Form>);
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };
  const save = async () => {
    if (!editing) return;
    const checked = checkForm(
      schoolWebsiteTemplateSchema,
      toPayload(editing.form),
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
      ? await updateSchoolWebsiteTemplate(editing.id, checked.data)
      : await createSchoolWebsiteTemplate(checked.data);
    setSaving(false);
    if (!result.success) return void toast.error(result.message);
    toast.success(editing.id ? "Template saved" : "Template added");
    setEditing(null);
    router.refresh();
  };

  const toggleVisible = async (t: Row) => {
    const result = await updateSchoolWebsiteTemplate(
      t.id,
      toPayload({ ...toForm(t), isVisible: !t.isVisible }),
    );
    if (!result.success) return void toast.error(result.message);
    toast.success(t.isVisible ? "Hidden from the page" : "Shown on the page");
    router.refresh();
  };

  const remove = async (t: Row) => {
    const ok = await confirm({
      title: `Delete “${t.name}”?`,
      description:
        "It's removed from the We Brand Schools page with its media list. This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteSchoolWebsiteTemplate(t.id);
    if (!result.success) return void toast.error(result.message);
    toast.success("Template deleted");
    router.refresh();
  };

  const removeMany = async (ids: string[]) => {
    const ok = await confirm({
      title: `Delete ${ids.length} template${ids.length === 1 ? "" : "s"}?`,
      description: "They're removed from the page. This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteSchoolWebsiteTemplates(ids);
    if (!result.success) return void toast.error(result.message);
    toast.success(result.message);
    router.refresh();
  };

  const columns: Column<Row>[] = [
    {
      key: "template",
      header: "Template",
      primary: true,
      sortValue: (t) => t.name.toLowerCase(),
      cell: (t) => (
        <span className="flex min-w-0 items-center gap-3">
          <Thumb t={t} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-bold">{t.name}</span>
            <span className="text-surface-muted line-clamp-1 text-xs">
              {t.summary}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "On the page",
      sortValue: (t) => (t.isVisible ? 0 : 1),
      cell: (t) =>
        t.isVisible ? (
          <StatusPill tone="success" dot>
            Shown
          </StatusPill>
        ) : (
          <StatusPill>Hidden</StatusPill>
        ),
    },
    {
      key: "media",
      header: "Media",
      hideBelow: "lg",
      sortValue: (t) => t.assets.length,
      cell: (t) => (
        <span className="text-surface-muted text-sm tabular-nums">
          {t.assets.length} item{t.assets.length === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      key: "live",
      header: "Live demo",
      hideBelow: "xl",
      cell: (t) =>
        t.websiteUrl ? (
          <a
            href={t.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="dx-link text-royal inline-flex max-w-[14rem] items-center gap-1 truncate text-sm"
          >
            {t.websiteUrl.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <span className="text-surface-muted text-sm">None</span>
        ),
    },
    {
      key: "order",
      header: "Order",
      sortValue: (t) => t.position,
      cell: (t) => <span className="tabular-nums">{t.position}</span>,
    },
  ];

  const f = editing?.form;

  return (
    <>
      <DataTable
        label="Templates"
        rows={templates}
        columns={columns}
        getRowId={(t) => t.id}
        rowLabel={(t) => t.name}
        onRowClick={(t) => open(t)}
        searchText={(t) => `${t.name} ${t.slug} ${t.summary}`}
        searchPlaceholder="Search templates"
        filters={[
          {
            key: "visible",
            label: "On the page",
            options: [
              { value: "shown", label: "Shown" },
              { value: "hidden", label: "Hidden" },
            ],
            match: (t, v) => (v === "shown" ? t.isVisible : !t.isVisible),
          },
        ]}
        rowActions={(t) => [
          { label: "Edit", icon: <Pencil />, onSelect: () => open(t) },
          {
            label: "Open live demo",
            icon: <ExternalLink />,
            href: t.websiteUrl ?? undefined,
            external: true,
            hidden: !t.websiteUrl,
          },
          {
            label: t.isVisible ? "Hide from the page" : "Show on the page",
            icon: t.isVisible ? <EyeOff /> : <Eye />,
            onSelect: () => void toggleVisible(t),
          },
          "separator",
          {
            label: "Delete",
            icon: <Trash2 />,
            danger: true,
            onSelect: () => void remove(t),
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
            <Plus aria-hidden className="size-4" /> Add template
          </Button>
        }
        empty={{
          icon: <LayoutTemplate />,
          title: "No templates yet",
          description:
            "Add the website designs schools can choose from, with screenshots or videos and a live demo link.",
          action: (
            <Button size="sm" onClick={() => open()}>
              <Plus aria-hidden className="size-4" /> Add template
            </Button>
          ),
        }}
      />

      <SidePanel
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        width="xl"
        title={editing?.id ? f?.name || "Edit template" : "New template"}
        description="Shown in the template grid on the We Brand Schools page. Schools pick one when they apply."
        footer={
          <>
            <Button size="sm" variant="subtle" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing?.id ? "Save" : "Add template"}
            </Button>
          </>
        }
      >
        {f && (
          <Tabs
            label="Template"
            value={tab}
            onValueChange={setTab}
            tabs={[
              {
                value: "details",
                label: "Details",
                content: (
                  <div className="flex flex-col gap-5">
                    <TextField
                      label="Name"
                      value={f.name}
                      onChange={(e) => set("name", e.target.value)}
                      error={errors.name}
                      required
                    />
                    {editing?.id ? (
                      <TextField
                        label="Template ID"
                        value={f.slug}
                        onChange={(e) =>
                          set("slug", e.target.value.toLowerCase())
                        }
                        error={errors.slug}
                        hint="Links this design to its editable files and to school projects. Change it only if the template files were renamed too."
                      />
                    ) : (
                      <SlugField
                        label="Template ID"
                        value={f.slug}
                        source={f.name}
                        basePath=""
                        onChange={(v) => set("slug", v)}
                        error={errors.slug}
                      />
                    )}
                    <TextareaField
                      label="Summary"
                      rows={3}
                      maxLength={220}
                      value={f.summary}
                      onChange={(e) => set("summary", e.target.value)}
                      hint="One or two lines on the template card."
                      error={errors.summary}
                      required
                    />
                    <TextareaField
                      label="Description"
                      rows={5}
                      maxLength={3000}
                      value={f.description}
                      onChange={(e) => set("description", e.target.value)}
                      hint="Shown when someone opens the template."
                      error={errors.description}
                    />
                    <ListEditor
                      label="Highlights"
                      value={f.highlights}
                      onChange={(v) => set("highlights", v)}
                      placeholder="e.g. Admissions page with online form"
                      addLabel="Add highlight"
                      max={8}
                      hint={
                        errors.highlights ??
                        "Up to 8 short points, 120 characters each."
                      }
                    />
                    <TextField
                      label="Live demo address"
                      value={f.websiteUrl}
                      onChange={(e) => set("websiteUrl", e.target.value)}
                      placeholder="https://"
                      error={errors.websiteUrl}
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
                      description="Hidden templates stay here but don't appear on /webrandschools."
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
                    intro="Shown in the template preview. Drag to set the order; the starred one is the card's cover. Videos need a cover image."
                    emptyText="Add at least one screenshot so the template card has something to show."
                  />
                ),
              },
            ]}
          />
        )}
      </SidePanel>
    </>
  );
}
