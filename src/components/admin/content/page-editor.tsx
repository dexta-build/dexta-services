"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  History,
  Loader2,
  Pencil,
  RotateCcw,
  Send,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorSection } from "@/lib/content/admin";
import {
  discardDraft,
  listVersions,
  publishPage,
  restoreVersion,
  saveSectionDraft,
  type VersionItem,
} from "@/app/admin/(studio)/pages/actions";
import { formatDate, timeAgo } from "@/lib/admin/format";
import { Button } from "@/components/site/button";
import { StatusPill } from "@/components/admin/kit/layout";
import { SwitchField } from "@/components/admin/kit/fields";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { Modal } from "@/components/admin/kit/overlays";
import { RowActions } from "@/components/admin/kit/row-actions";
import { Callout } from "@/components/admin/kit/display";
import { useConfirm } from "@/components/admin/kit/feedback";
import { useUnsavedChangesWarning } from "@/components/admin/kit/save-bar";
import { SectionForm } from "./section-form";

type Data = Record<string, unknown>;

/**
 * Edit a page section by section. Saving keeps a draft (nothing changes on
 * the site); Preview shows drafts on the real page; Publish makes them live
 * and keeps a version you can restore.
 */
export function PageEditor({
  pageKey,
  pageLabel,
  previewPath,
  sections,
}: {
  pageKey: string;
  pageLabel: string;
  previewPath: string | null;
  sections: EditorSection[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<EditorSection | null>(null);
  const [historyFor, setHistoryFor] = useState<EditorSection | null>(null);
  const [publishing, startPublish] = useTransition();
  const drafts = sections.filter((s) => s.status === "draft");

  const publishAll = async () => {
    const ok = await confirm({
      title: `Publish ${drafts.length} change${drafts.length === 1 ? "" : "s"} to ${pageLabel}?`,
      description: `${drafts.map((d) => d.label).join(", ")} will go live straight away. Earlier versions stay in each section's history.`,
      confirmLabel: "Publish",
    });
    if (!ok) return;
    startPublish(async () => {
      const res = await publishPage(pageKey);
      if (!res.success) return void toast.error(res.message);
      toast.success(
        `Published ${res.count} change${res.count === 1 ? "" : "s"}`,
      );
      router.refresh();
    });
  };

  const discard = async (s: EditorSection) => {
    const ok = await confirm({
      title: `Discard your changes to ${s.label}?`,
      description: "The section goes back to what's live on the site.",
      confirmLabel: "Discard",
      danger: true,
    });
    if (!ok) return;
    const res = await discardDraft(pageKey, s.key);
    if (!res.success) return void toast.error(res.message);
    toast.success("Changes discarded");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Publish bar */}
      <div
        className={cn(
          "sticky top-[4.5rem] z-20 flex flex-col gap-3 rounded-[12px] px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
          drafts.length
            ? "bg-royal text-white shadow-[0_18px_40px_-20px_rgb(0_8_107/0.6)]"
            : "bg-white ring-1 ring-black/[0.06]",
        )}
        data-surface={drafts.length ? "royal" : undefined}
      >
        <p className="text-sm font-bold" aria-live="polite">
          {drafts.length
            ? `${drafts.length} unpublished change${drafts.length === 1 ? "" : "s"}`
            : "Everything is published"}
        </p>
        <div className="flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
          {previewPath && (
            <Button
              size="sm"
              variant={drafts.length ? "subtle" : "outline"}
              href={`/api/preview?path=${encodeURIComponent(previewPath)}`}
              external
            >
              <Eye aria-hidden className="size-4" />
              {drafts.length ? "Preview changes" : "View page"}
            </Button>
          )}
          {drafts.length > 0 && (
            <Button size="sm" onClick={publishAll} disabled={publishing}>
              {publishing ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : (
                <Send aria-hidden className="size-4" />
              )}
              Publish
            </Button>
          )}
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        {sections.map((s, i) => (
          <li
            key={s.key}
            className="flex items-center gap-3 rounded-[12px] bg-white p-3 ring-1 ring-black/[0.06] sm:gap-4 sm:p-4"
          >
            <span className="bg-canvas text-surface-muted hidden size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums sm:inline-flex">
              {i + 1}
            </span>
            <button
              type="button"
              onClick={() => setEditing(s)}
              className="flex min-w-0 flex-1 flex-col gap-1 text-left outline-none focus-visible:underline"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{s.label}</span>
                {s.status === "draft" && (
                  <StatusPill tone="warning" dot>
                    Draft
                  </StatusPill>
                )}
                {s.status === "published" && (
                  <StatusPill tone="success" dot>
                    Published
                  </StatusPill>
                )}
                {s.current.hidden && (
                  <StatusPill>
                    <EyeOff aria-hidden className="size-3" /> Hidden
                  </StatusPill>
                )}
              </span>
              {s.description && (
                <span className="text-surface-muted line-clamp-2 text-xs sm:text-sm">
                  {s.description}
                </span>
              )}
              {(s.publishedAt || s.updatedBy) && (
                <span className="text-surface-muted text-xs">
                  {s.status === "draft" && s.updatedBy
                    ? `Draft by ${s.updatedBy}`
                    : s.publishedAt
                      ? `Published ${timeAgo(s.publishedAt)}${s.publishedBy ? ` by ${s.publishedBy}` : ""}`
                      : null}
                </span>
              )}
            </button>
            <Button
              size="sm"
              variant="subtle"
              onClick={() => setEditing(s)}
              className="hidden sm:inline-flex"
            >
              <Pencil aria-hidden className="size-3.5" /> Edit
            </Button>
            <RowActions
              label={`Actions for ${s.label}`}
              title={s.label}
              actions={[
                {
                  label: "Edit",
                  icon: <Pencil />,
                  onSelect: () => setEditing(s),
                },
                {
                  label: "History",
                  icon: <History />,
                  onSelect: () => setHistoryFor(s),
                },
                {
                  label: "Discard changes",
                  icon: <Undo2 />,
                  hidden: s.status !== "draft",
                  onSelect: () => void discard(s),
                },
              ]}
            />
          </li>
        ))}
      </ol>

      <SectionEditPanel
        key={editing?.key ?? "none"}
        pageKey={pageKey}
        section={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />

      <HistoryModal
        key={historyFor?.key ?? "history"}
        pageKey={pageKey}
        section={historyFor}
        onClose={() => setHistoryFor(null)}
        onRestored={() => {
          setHistoryFor(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function SectionEditPanel({
  pageKey,
  section,
  onClose,
  onSaved,
}: {
  pageKey: string;
  section: EditorSection | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const confirm = useConfirm();
  const initial = useMemo(
    () => JSON.stringify(section?.current ?? null),
    [section],
  );
  const [data, setData] = useState<Data>((section?.current.data as Data) ?? {});
  const [hidden, setHidden] = useState(section?.current.hidden ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, startSaving] = useTransition();
  const dirty = !!section && JSON.stringify({ data, hidden }) !== initial;
  useUnsavedChangesWarning(dirty);

  useEffect(() => setErrors({}), [section]);

  const close = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Close without saving?",
        description: "Your changes to this section will be lost.",
        confirmLabel: "Close",
        danger: true,
      }))
    )
      return;
    onClose();
  };

  const save = () => {
    if (!section) return;
    startSaving(async () => {
      const res = await saveSectionDraft(pageKey, section.key, {
        data,
        hidden,
      });
      if (!res.success) {
        setErrors(res.errors ?? {});
        toast.error(res.message);
        return;
      }
      toast.success("Draft saved. Publish the page to make it live.");
      onSaved();
    });
  };

  const resetToDefault = async () => {
    if (!section) return;
    const ok = await confirm({
      title: "Reset this section to its original content?",
      description:
        "The form is filled with the original text and images. Nothing changes until you save and publish.",
      confirmLabel: "Reset",
    });
    if (ok) setData(globalThis.structuredClone(section.defaults as Data));
  };

  return (
    <SidePanel
      open={!!section}
      onOpenChange={(o) => !o && void close()}
      title={section?.label ?? "Section"}
      description={section?.description}
      width="lg"
      footer={
        section ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="mr-auto"
              onClick={() => void resetToDefault()}
            >
              <RotateCcw aria-hidden className="size-3.5" /> Reset
            </Button>
            <Button variant="subtle" size="sm" onClick={() => void close()}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving || !dirty}>
              {saving && (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              )}
              Save draft
            </Button>
          </>
        ) : null
      }
    >
      {section && (
        <div className="flex flex-col gap-6">
          {section.canHide && (
            <div className="rounded-[10px] bg-white p-4 ring-1 ring-black/[0.06]">
              <SwitchField
                label="Show this section on the page"
                description="Turn off to hide it without losing its content."
                checked={!hidden}
                onCheckedChange={(on) => setHidden(!on)}
              />
            </div>
          )}
          {Object.keys(errors).length > 0 && (
            <Callout tone="danger" title="Some fields need attention">
              They&apos;re marked in red below.
            </Callout>
          )}
          <SectionForm
            fields={section.fields}
            value={data}
            onChange={setData}
            errors={errors}
          />
        </div>
      )}
    </SidePanel>
  );
}

function HistoryModal({
  pageKey,
  section,
  onClose,
  onRestored,
}: {
  pageKey: string;
  section: EditorSection | null;
  onClose: () => void;
  onRestored: () => void;
}) {
  const confirm = useConfirm();
  const [versions, setVersions] = useState<VersionItem[] | null>(null);
  const [busy, start] = useTransition();

  useEffect(() => {
    if (!section) return;
    let live = true;
    void listVersions(pageKey, section.key).then((res) => {
      if (live) setVersions(res.success ? res.versions : []);
    });
    return () => {
      live = false;
    };
  }, [pageKey, section]);

  return (
    <Modal
      open={!!section}
      onOpenChange={(o) => !o && onClose()}
      title={section ? `${section.label}: history` : "History"}
      description="Every published version. Restoring puts it back as a draft, so you can preview it before publishing."
      size="md"
    >
      {versions === null ? (
        <p className="text-surface-muted flex items-center gap-2 text-sm">
          <Loader2 aria-hidden className="size-4 animate-spin" /> Loading…
        </p>
      ) : versions.length === 0 ? (
        <p className="text-surface-muted text-sm">
          Not published yet. The original content is shown on the site.
        </p>
      ) : (
        <ol className="flex flex-col">
          {versions.map((v, i) => (
            <li
              key={v.id}
              className="border-surface-rule flex items-center justify-between gap-3 border-b py-3 last:border-b-0"
            >
              <div>
                <p className="text-sm font-bold">
                  {formatDate(v.createdAt, true)}
                  {i === 0 && (
                    <StatusPill tone="success" className="ml-2">
                      Live
                    </StatusPill>
                  )}
                </p>
                <p className="text-surface-muted text-xs">
                  {v.publishedBy
                    ? `Published by ${v.publishedBy}`
                    : "Published"}
                </p>
              </div>
              {i > 0 && (
                <Button
                  size="sm"
                  variant="subtle"
                  disabled={busy}
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Restore this version?",
                      description:
                        "It becomes the section's draft. Preview it, then publish to make it live.",
                      confirmLabel: "Restore",
                    });
                    if (!ok) return;
                    start(async () => {
                      const res = await restoreVersion(pageKey, v.id);
                      if (!res.success) return void toast.error(res.message);
                      toast.success("Restored as a draft");
                      onRestored();
                    });
                  }}
                >
                  <RotateCcw aria-hidden className="size-3.5" /> Restore
                </Button>
              )}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
