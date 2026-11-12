"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Link2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { CatalogPillar, CatalogService } from "@/lib/services/catalog";
import { ICON_OPTIONS } from "@/lib/content/options";
import { Button } from "@/components/site/button";
import { AdminCard, StatusPill } from "@/components/admin/kit/layout";
import {
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import { SlugField } from "@/components/admin/kit/inputs";
import { SortableList } from "@/components/admin/kit/sortable-list";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { Modal } from "@/components/admin/kit/overlays";
import { RowActions } from "@/components/admin/kit/row-actions";
import { useConfirm } from "@/components/admin/kit/feedback";
import { MediaValueField } from "@/components/admin/content/media-value-field";
import { NavIcon } from "@/components/site/shell/nav-icon";
import { asIcon } from "@/components/site/shell/nav-data";
import {
  createService,
  deleteService,
  reorderPillars,
  reorderServices,
  setPillarVisible,
  setServiceVisible,
  updatePillar,
  updateService,
  type ServiceInput,
} from "./actions";

type Result = { success: boolean; message?: string };

const PILL_COLOURS = [
  { value: "bg-brand-cyan text-royal", label: "Cyan" },
  { value: "bg-royal text-ice", label: "Royal blue" },
  { value: "bg-ocean text-white", label: "Ocean" },
  { value: "bg-gold text-royal", label: "Gold" },
  { value: "bg-mint text-royal", label: "Mint" },
  { value: "bg-coral text-royal", label: "Coral" },
];

/** Saves an order a moment after the last drag, not on every frame. */
function useDebouncedSave(save: (ids: string[]) => Promise<Result>) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => void (timer.current && clearTimeout(timer.current)),
    [],
  );
  return (ids: string[]) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await save(ids);
      if (!res.success) toast.error(res.message ?? "Couldn't save the order.");
      else toast.success("Order saved");
    }, 700);
  };
}

export function ServicesManager({ catalog }: { catalog: CatalogPillar[] }) {
  const router = useRouter();
  const [pillars, setPillars] = useState(catalog);
  const [editing, setEditing] = useState<{
    pillarId: string;
    service?: CatalogService;
  } | null>(null);
  const [editingPillar, setEditingPillar] = useState<CatalogPillar | null>(
    null,
  );
  const confirm = useConfirm();
  const [, startTransition] = useTransition();

  // Keep local order in step after the server refreshes.
  useEffect(() => setPillars(catalog), [catalog]);

  const run = (fn: () => Promise<Result>, ok: string) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.success)
        return void toast.error(res.message ?? "That didn't work.");
      toast.success(ok);
      router.refresh();
    });

  const savePillarOrder = useDebouncedSave((ids) => reorderPillars(ids));

  return (
    <div className="flex flex-col gap-8">
      <AdminCard
        title="Groups"
        description="Drag to change the order of the groups in the menu, footer and Services page."
      >
        <SortableList
          label="Service groups order"
          items={pillars}
          getId={(p) => p.id ?? p.key}
          onReorder={(next) => {
            setPillars(next);
            savePillarOrder(next.map((p) => p.id!));
          }}
          renderItem={(p) => (
            <div className="flex flex-wrap items-center gap-3 py-1">
              <span
                className={`${p.pillClass ?? "bg-ice text-royal"} rounded-[8px] px-3 py-1 font-[family-name:var(--font-accent)] text-lg leading-none`}
              >
                {p.title}
              </span>
              <span className="text-surface-muted text-xs">
                {p.services.filter((s) => s.isVisible).length} of{" "}
                {p.services.length} services shown
              </span>
              {!p.isVisible && <StatusPill>Hidden</StatusPill>}
            </div>
          )}
        />
      </AdminCard>

      {pillars.map((p) => (
        <PillarCard
          key={p.key}
          pillar={p}
          onEditPillar={() => setEditingPillar(p)}
          onTogglePillar={() =>
            run(
              () => setPillarVisible(p.id!, !p.isVisible),
              p.isVisible ? `${p.title} hidden` : `${p.title} shown`,
            )
          }
          onAdd={() => setEditing({ pillarId: p.id! })}
          onEdit={(s) => setEditing({ pillarId: p.id!, service: s })}
          onToggle={(s) =>
            run(
              () => setServiceVisible(s.id!, !s.isVisible),
              s.isVisible ? `${s.title} hidden` : `${s.title} shown`,
            )
          }
          onDelete={async (s) => {
            const ok = await confirm({
              title: `Delete ${s.title}?`,
              description: s.externalHref
                ? "It's removed from the menu. The page it links to isn't affected."
                : "Its page and all of its text and history are deleted. To take it off the site but keep it, hide it instead.",
              danger: true,
            });
            if (ok) run(() => deleteService(s.id!), `${s.title} deleted`);
          }}
          onReordered={(services) =>
            setPillars((all) =>
              all.map((x) => (x.key === p.key ? { ...x, services } : x)),
            )
          }
        />
      ))}

      <ServicePanel
        key={
          editing
            ? `${editing.pillarId}-${editing.service?.id ?? "new"}`
            : "closed"
        }
        open={!!editing}
        pillars={pillars}
        pillarId={editing?.pillarId ?? ""}
        service={editing?.service}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />

      <PillarModal
        key={editingPillar?.id ?? "none"}
        pillar={editingPillar}
        onClose={() => setEditingPillar(null)}
        onSaved={() => {
          setEditingPillar(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function PillarCard({
  pillar,
  onEditPillar,
  onTogglePillar,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
  onReordered,
}: {
  pillar: CatalogPillar;
  onEditPillar: () => void;
  onTogglePillar: () => void;
  onAdd: () => void;
  onEdit: (s: CatalogService) => void;
  onToggle: (s: CatalogService) => void;
  onDelete: (s: CatalogService) => void;
  onReordered: (services: CatalogService[]) => void;
}) {
  const saveOrder = useDebouncedSave((ids) => reorderServices(pillar.id!, ids));
  return (
    <AdminCard
      title={
        <span className="flex flex-wrap items-center gap-2">
          {pillar.title}
          {!pillar.isVisible && <StatusPill>Hidden from the site</StatusPill>}
        </span>
      }
      description={`/services/${pillar.key}`}
      actions={
        <>
          <Button
            size="sm"
            variant="subtle"
            href={`/admin/pages/service.${pillar.key}`}
            className="hidden sm:inline-flex"
          >
            <FileText aria-hidden className="size-3.5" /> Edit overview page
          </Button>
          <RowActions
            label={`Actions for the ${pillar.title} group`}
            title={pillar.title}
            actions={[
              {
                label: "Edit overview page",
                icon: <FileText />,
                href: `/admin/pages/service.${pillar.key}`,
              },
              {
                label: "View on site",
                icon: <ExternalLink />,
                href: `/services/${pillar.key}`,
                external: true,
                hidden: !pillar.isVisible,
              },
              {
                label: "Rename or recolour",
                icon: <Pencil />,
                onSelect: onEditPillar,
              },
              "separator",
              {
                label: pillar.isVisible ? "Hide this group" : "Show this group",
                icon: pillar.isVisible ? <EyeOff /> : <Eye />,
                onSelect: onTogglePillar,
              },
            ]}
          />
        </>
      }
    >
      {pillar.services.length === 0 ? (
        <p className="text-surface-muted mb-4 text-sm">
          No services in this group yet.
        </p>
      ) : (
        <SortableList
          label={`${pillar.title} services order`}
          items={pillar.services}
          getId={(s) => s.id ?? s.slug}
          onReorder={(next) => {
            onReordered(next);
            saveOrder(next.map((s) => s.id!));
          }}
          renderItem={(s) => (
            <div className="flex items-center gap-3">
              <span className="bg-canvas text-royal inline-flex size-9 shrink-0 items-center justify-center rounded-full">
                <NavIcon name={asIcon(s.icon)} className="size-4" />
              </span>
              <button
                type="button"
                onClick={() => onEdit(s)}
                className="flex min-w-0 flex-1 flex-col text-left outline-none focus-visible:underline"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">{s.title}</span>
                  {!s.isVisible && <StatusPill>Hidden</StatusPill>}
                  {s.externalHref && (
                    <StatusPill tone="brand">
                      <Link2 aria-hidden className="size-3" /> Link
                    </StatusPill>
                  )}
                </span>
                <span className="text-surface-muted truncate text-xs">
                  {s.description || "No description"} ·{" "}
                  {s.externalHref ?? `/services/${pillar.key}/${s.slug}`}
                </span>
              </button>
              <RowActions
                label={`Actions for ${s.title}`}
                title={s.title}
                actions={[
                  {
                    label: "Edit details",
                    icon: <Pencil />,
                    onSelect: () => onEdit(s),
                  },
                  {
                    label: "Edit page",
                    icon: <FileText />,
                    href: `/admin/pages/service.${pillar.key}.${s.slug}`,
                    hidden: !!s.externalHref,
                  },
                  {
                    label: "View on site",
                    icon: <ExternalLink />,
                    href: s.externalHref ?? `/services/${pillar.key}/${s.slug}`,
                    external: true,
                    hidden: !s.isVisible || !pillar.isVisible,
                  },
                  "separator",
                  {
                    label: s.isVisible ? "Hide" : "Show",
                    icon: s.isVisible ? <EyeOff /> : <Eye />,
                    onSelect: () => onToggle(s),
                  },
                  {
                    label: "Delete",
                    icon: <Trash2 />,
                    danger: true,
                    onSelect: () => onDelete(s),
                  },
                ]}
              />
            </div>
          )}
        />
      )}
      <Button size="sm" variant="subtle" onClick={onAdd} className="mt-4">
        <Plus aria-hidden className="size-4" /> Add a{" "}
        {pillar.title.toLowerCase()} service
      </Button>
    </AdminCard>
  );
}

function ServicePanel({
  open,
  pillars,
  pillarId,
  service,
  onClose,
  onSaved,
}: {
  open: boolean;
  pillars: CatalogPillar[];
  pillarId: string;
  service?: CatalogService;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !service;
  const [form, setForm] = useState<ServiceInput>({
    pillarId,
    title: service?.title ?? "",
    slug: service?.slug ?? "",
    shortName: service?.shortName ?? "",
    description: service?.description ?? "",
    icon: service?.icon ?? "sparkles",
    cardImage: service?.cardImage ?? "",
    externalHref: service?.externalHref ?? null,
    isVisible: service?.isVisible ?? true,
  });
  const [linkOnly, setLinkOnly] = useState(!!service?.externalHref);
  const [saving, start] = useTransition();
  const pillar = pillars.find((p) => p.id === form.pillarId);
  const set = <K extends keyof ServiceInput>(k: K, v: ServiceInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const input = {
        ...form,
        shortName: form.shortName || form.title.toLowerCase(),
        externalHref: linkOnly ? form.externalHref || null : null,
      };
      const res = service
        ? await updateService(service.id!, input)
        : await createService(input);
      if (!res.success) return void toast.error(res.message);
      toast.success(
        isNew
          ? linkOnly
            ? "Link added to the menu"
            : "Service added. Its page starts from the group's text: edit it next."
          : "Service saved",
      );
      onSaved();
    });
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={isNew ? "Add a service" : service.title}
      description={
        isNew
          ? "It appears in the Services menu, the footer and its group's pages straight away."
          : "Name, address and how it shows in menus and cards."
      }
      width="lg"
      footer={
        <>
          {!isNew && !service.externalHref && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto"
              href={`/admin/pages/service.${pillar?.key}.${service.slug}`}
            >
              <FileText aria-hidden className="size-3.5" /> Edit page
            </Button>
          )}
          <Button size="sm" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="service-form" disabled={saving}>
            {saving ? "Saving" : isNew ? "Add service" : "Save"}
          </Button>
        </>
      }
    >
      <form id="service-form" onSubmit={submit} className="flex flex-col gap-5">
        <TextField
          label="Name"
          required
          autoFocus
          maxLength={60}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          hint="Shown in the menu and on cards, e.g. Brand identity."
        />
        <SelectField
          label="Group"
          value={form.pillarId}
          onChange={(e) => set("pillarId", e.target.value)}
          options={pillars.map((p) => ({ value: p.id!, label: p.title }))}
        />
        <SwitchField
          label="Link to another page instead"
          description="For menu items without their own service page, like School portals."
          checked={linkOnly}
          onCheckedChange={setLinkOnly}
        />
        {linkOnly ? (
          <TextField
            label="Goes to"
            required
            value={form.externalHref ?? ""}
            onChange={(e) => set("externalHref", e.target.value.trim())}
            placeholder="/webrandschools or https://…"
          />
        ) : null}
        <SlugField
          label={linkOnly ? "Short ID" : "Page address"}
          value={form.slug}
          onChange={(v) => set("slug", v)}
          source={form.title}
          basePath={`/services/${pillar?.key ?? ""}/`}
        />
        {!isNew && !linkOnly && form.slug !== service.slug && (
          <p className="text-gold-deep -mt-3 text-xs font-bold">
            The old address will stop working. The page&apos;s text moves with
            it.
          </p>
        )}
        <TextField
          label="Short name"
          maxLength={60}
          value={form.shortName}
          onChange={(e) => set("shortName", e.target.value)}
          placeholder={form.title.toLowerCase()}
          hint="Used in sentences, e.g. “Questions about branding” and the WhatsApp message."
        />
        <TextareaField
          label="One-line description"
          rows={2}
          maxLength={120}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          hint="Under the name in the menu and on cards."
        />
        <SelectField
          label="Menu icon"
          value={form.icon}
          onChange={(e) => set("icon", e.target.value)}
          options={ICON_OPTIONS}
        />
        <MediaValueField
          label="Card image"
          value={form.cardImage}
          onChange={(v) => set("cardImage", v)}
          optional
          hint="On the group's page, the Services page and related-services cards."
        />
        <SwitchField
          label="Show on the site"
          description="Hidden services leave the menus and their page stops working, but nothing is deleted."
          checked={form.isVisible}
          onCheckedChange={(v) => set("isVisible", v)}
        />
      </form>
    </SidePanel>
  );
}

function PillarModal({
  pillar,
  onClose,
  onSaved,
}: {
  pillar: CatalogPillar | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(pillar?.title ?? "");
  const [pillClass, setPillClass] = useState(
    pillar?.pillClass ?? PILL_COLOURS[0].value,
  );
  const [saving, start] = useTransition();
  return (
    <Modal
      open={!!pillar}
      onOpenChange={(o) => !o && onClose()}
      title={pillar ? `Edit ${pillar.title}` : "Edit group"}
      description="The address stays the same."
      size="sm"
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || !title.trim()}
            onClick={() =>
              start(async () => {
                const res = await updatePillar(pillar!.id!, {
                  title,
                  pillClass,
                });
                if (!res.success) return void toast.error(res.message);
                toast.success("Group saved");
                onSaved();
              })
            }
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <TextField
          label="Name"
          maxLength={30}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <SelectField
          label="Menu colour"
          value={pillClass}
          onChange={(e) => setPillClass(e.target.value)}
          options={PILL_COLOURS}
        />
        <span
          className={`${pillClass} self-start rounded-[10px] px-4 py-2 font-[family-name:var(--font-accent)] text-2xl leading-none`}
        >
          {title || "Preview"}
        </span>
      </div>
    </Modal>
  );
}
