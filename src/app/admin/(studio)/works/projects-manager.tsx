"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  ImageOff,
  Pencil,
  Plus,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { stock, isVideoSource } from "@/lib/site/stock-media";
import { Button } from "@/components/site/button";
import { EmptyState, StatusPill } from "@/components/admin/kit/layout";
import {
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import {
  SearchInput,
  SlugField,
  TagInput,
} from "@/components/admin/kit/inputs";
import { SortableList } from "@/components/admin/kit/sortable-list";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { RowActions } from "@/components/admin/kit/row-actions";
import { useConfirm } from "@/components/admin/kit/feedback";
import { GalleryField } from "@/components/admin/content/section-form";
import {
  deleteProject,
  importSampleProjects,
  reorderProjects,
  saveProject,
  setProjectFlags,
  type ProjectInput,
} from "./actions";

export type ProjectRow = {
  id: string;
  title: string;
  clientName: string | null;
  slug: string;
  description: string;
  serviceType: "DESIGN" | "BUILD" | "PRINT";
  service: string | null;
  occasion: string | null;
  tags: string[];
  websiteUrl: string | null;
  isFeatured: boolean;
  isVisible: boolean;
  media: string[];
};

type Option = { value: string; label: string; group?: string };
type Result = { success: boolean; message?: string };

const GROUPS: Option[] = [
  { value: "DESIGN", label: "Design" },
  { value: "BUILD", label: "Build" },
  { value: "PRINT", label: "Print" },
];
const GROUP_LABEL = Object.fromEntries(GROUPS.map((g) => [g.value, g.label]));

function label(p: ProjectRow, services: Option[]) {
  const svc = services.find((s) => s.value === p.service)?.label;
  return [p.occasion, svc ?? GROUP_LABEL[p.serviceType]]
    .filter(Boolean)
    .join(" · ");
}

function Thumb({ value }: { value?: string }) {
  if (!value)
    return (
      <span className="bg-canvas text-surface-muted inline-flex size-14 shrink-0 items-center justify-center rounded-[8px]">
        <ImageOff aria-hidden className="size-5" />
      </span>
    );
  return isVideoSource(value) ? (
    <video
      src={value}
      muted
      playsInline
      preload="metadata"
      className="size-14 shrink-0 rounded-[8px] object-cover"
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- previews from any host
    <img
      src={stock(value, 160, 160)}
      alt=""
      loading="lazy"
      className="bg-canvas size-14 shrink-0 rounded-[8px] object-cover"
    />
  );
}

export function ProjectsManager({
  projects,
  services,
  occasions,
  samplesLeft,
}: {
  projects: ProjectRow[];
  services: Option[];
  occasions: string[];
  samplesLeft: number;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [items, setItems] = useState(projects);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ProjectRow | "new" | null>(null);
  const [busy, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setItems(projects), [projects]);

  const run = (fn: () => Promise<Result>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (!res.success)
        return void toast.error(res.message ?? "That didn't work.");
      toast.success(ok);
      router.refresh();
    });

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter((p) =>
        [p.title, p.clientName, p.occasion, ...p.tags].some((t) =>
          t?.toLowerCase().includes(q),
        ),
      )
    : items;

  const onReorder = (next: ProjectRow[]) => {
    setItems(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await reorderProjects(next.map((p) => p.id));
      if (!res.success) toast.error(res.message);
      else toast.success("Order saved");
    }, 700);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search projects"
          className="w-full md:w-72"
        />
        <div className="flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
          {samplesLeft > 0 && (
            <Button
              size="sm"
              variant="subtle"
              disabled={busy}
              onClick={async () => {
                const ok = await confirm({
                  title: `Import ${samplesLeft} sample project${samplesLeft === 1 ? "" : "s"}?`,
                  description:
                    "They're added as hidden projects with their stock photos, ready to edit, replace and show. Nothing changes on the site until you show them.",
                  confirmLabel: "Import",
                });
                if (ok)
                  run(async () => {
                    const res = await importSampleProjects();
                    return res.success ? { success: true } : res;
                  }, "Sample projects imported (hidden)");
              }}
            >
              <Download aria-hidden className="size-4" /> Import samples
            </Button>
          )}
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus aria-hidden className="size-4" /> Add project
          </Button>
        </div>
      </div>

      <p className="text-surface-muted text-sm">
        Featured projects show first and in the large row on the Works page; the
        rest follow this order.
        {q && " Clear the search to reorder."}
      </p>

      {items.length === 0 ? (
        <EmptyState
          icon={<ImageOff />}
          title="No projects yet"
          description="Add your first project, or import the sample projects to start from."
          action={
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus aria-hidden className="size-4" /> Add project
            </Button>
          }
          className="bg-white"
        />
      ) : q ? (
        <ul className="flex flex-col gap-2">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-[10px] bg-white p-2 pr-3 ring-1 ring-black/[0.06]"
            >
              <Row p={p} services={services} onEdit={() => setEditing(p)} />
            </li>
          ))}
        </ul>
      ) : (
        <SortableList
          label="Projects order"
          items={items}
          getId={(p) => p.id}
          onReorder={onReorder}
          renderItem={(p) => (
            <div className="flex items-center gap-3">
              <Row p={p} services={services} onEdit={() => setEditing(p)} />
              <RowActions
                label={`Actions for ${p.clientName || p.title}`}
                title={p.clientName || p.title}
                actions={[
                  {
                    label: "Edit",
                    icon: <Pencil />,
                    onSelect: () => setEditing(p),
                  },
                  {
                    label: "View on site",
                    icon: <ExternalLink />,
                    href: `/works/${p.slug}`,
                    external: true,
                    hidden: !p.isVisible,
                  },
                  {
                    label: p.isFeatured ? "Stop featuring" : "Feature",
                    icon: p.isFeatured ? <StarOff /> : <Star />,
                    onSelect: () =>
                      run(
                        () =>
                          setProjectFlags(p.id, { isFeatured: !p.isFeatured }),
                        p.isFeatured ? "No longer featured" : "Featured",
                      ),
                  },
                  {
                    label: p.isVisible ? "Hide" : "Show",
                    icon: p.isVisible ? <EyeOff /> : <Eye />,
                    onSelect: () =>
                      run(
                        () =>
                          setProjectFlags(p.id, { isVisible: !p.isVisible }),
                        p.isVisible ? "Hidden" : "Shown",
                      ),
                  },
                  "separator",
                  {
                    label: "Delete",
                    icon: <Trash2 />,
                    danger: true,
                    onSelect: async () => {
                      const ok = await confirm({
                        title: `Delete ${p.clientName || p.title}?`,
                        description:
                          "The project and its gallery are removed from the site. The files stay in the media library.",
                        danger: true,
                      });
                      if (ok) run(() => deleteProject(p.id), "Project deleted");
                    },
                  },
                ]}
              />
            </div>
          )}
        />
      )}

      <ProjectPanel
        key={editing === "new" ? "new" : (editing?.id ?? "closed")}
        project={editing === "new" ? null : editing}
        open={editing !== null}
        services={services}
        occasions={occasions}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function Row({
  p,
  services,
  onEdit,
}: {
  p: ProjectRow;
  services: Option[];
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:underline"
    >
      <Thumb value={p.media[0]} />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-bold">
            {p.clientName || p.title}
          </span>
          {p.isFeatured && (
            <StatusPill tone="royal">
              <Star aria-hidden className="size-3" /> Featured
            </StatusPill>
          )}
          {!p.isVisible && <StatusPill>Hidden</StatusPill>}
        </span>
        <span className="text-surface-muted truncate text-xs">
          {label(p, services)} · {p.media.length}{" "}
          {p.media.length === 1 ? "item" : "items"}
        </span>
      </span>
    </button>
  );
}

function ProjectPanel({
  project,
  open,
  services,
  occasions,
  onClose,
  onSaved,
}: {
  project: ProjectRow | null;
  open: boolean;
  services: Option[];
  occasions: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProjectInput>({
    title: project?.title ?? "",
    clientName: project?.clientName ?? "",
    slug: project?.slug ?? "",
    description: project?.description ?? "",
    serviceType: project?.serviceType ?? "DESIGN",
    service: project?.service ?? "",
    occasion: project?.occasion ?? "",
    tags: project?.tags ?? [],
    websiteUrl: project?.websiteUrl ?? "",
    media: project?.media ?? [],
    isFeatured: project?.isFeatured ?? false,
    isVisible: project?.isVisible ?? true,
  });
  const [saving, start] = useTransition();
  const set = <K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const groupServices = services.filter((s) => s.group === form.serviceType);
  const occasionOptions = [
    { value: "", label: "None" },
    ...occasions.map((o) => ({ value: o, label: o })),
    ...(form.occasion && !occasions.includes(form.occasion)
      ? [
          {
            value: form.occasion,
            label: `${form.occasion} (no longer in the list)`,
          },
        ]
      : []),
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveProject(project?.id ?? null, form);
      if (!res.success) return void toast.error(res.message);
      toast.success(project ? "Project saved" : "Project added");
      onSaved();
    });
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={project ? project.clientName || project.title : "Add a project"}
      description="Gallery, details and where it shows."
      width="xl"
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="project-form" disabled={saving}>
            {saving ? "Saving" : project ? "Save" : "Add project"}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} className="flex flex-col gap-6">
        <GalleryField
          label="Images and videos"
          value={form.media}
          onChange={(v) => set("media", v)}
          videos
          max={40}
          hint="The first one is the cover on the Works page and project page. Projects with more than 4 open full screen."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Title"
            required
            maxLength={120}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
          <TextField
            label="Client or brand"
            maxLength={120}
            value={form.clientName ?? ""}
            onChange={(e) => set("clientName", e.target.value)}
            hint="Shown instead of the title when filled in."
          />
        </div>
        <SlugField
          value={form.slug}
          onChange={(v) => set("slug", v)}
          source={form.clientName || form.title}
          basePath="/works/"
        />
        <TextareaField
          label="Description"
          rows={4}
          maxLength={2000}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
        <div className="grid gap-5 md:grid-cols-3">
          <SelectField
            label="Service group"
            value={form.serviceType}
            onChange={(e) => {
              const g = e.target.value as ProjectInput["serviceType"];
              setForm((f) => ({
                ...f,
                serviceType: g,
                service: services.some(
                  (s) => s.value === f.service && s.group === g,
                )
                  ? f.service
                  : "",
              }));
            }}
            options={GROUPS}
          />
          <SelectField
            label="Service (optional)"
            value={form.service ?? ""}
            onChange={(e) => set("service", e.target.value)}
            options={[{ value: "", label: "None" }, ...groupServices]}
          />
          <SelectField
            label="Occasion (optional)"
            value={form.occasion ?? ""}
            onChange={(e) => set("occasion", e.target.value)}
            options={occasionOptions}
            hint="Edit the list in Site settings → Project occasions."
          />
        </div>
        <TagInput
          label="Tags"
          value={form.tags}
          onChange={(v) => set("tags", v)}
          max={12}
        />
        <TextField
          label="Website (optional)"
          value={form.websiteUrl ?? ""}
          onChange={(e) => set("websiteUrl", e.target.value.trim())}
          placeholder="https://…"
          hint="Adds a Visit website button on the project page."
        />
        <div className="flex flex-col gap-4 rounded-[10px] bg-white p-4 ring-1 ring-black/[0.06]">
          <SwitchField
            label="Featured"
            description="Shows first, in the large row on the Works page and in the homepage's featured works."
            checked={form.isFeatured}
            onCheckedChange={(v) => set("isFeatured", v)}
          />
          <SwitchField
            label="Show on the site"
            description="Hidden projects keep everything but don't appear anywhere."
            checked={form.isVisible}
            onCheckedChange={(v) => set("isVisible", v)}
          />
        </div>
      </form>
    </SidePanel>
  );
}
