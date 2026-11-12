"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import {
  formatBytes,
  formatDuration,
  KIND_LABELS,
  mediaValue,
  thumbnailUrl,
  type MediaAssetDTO,
  type MediaFolderDTO,
} from "@/lib/media/shared";
import { formatDate } from "@/lib/admin/format";
import { getMediaUsage, updateMedia } from "@/app/admin/(studio)/media/actions";
import type { MediaUsage } from "@/lib/media/usage";
import { Button } from "@/components/site/button";
import { SidePanel } from "@/components/admin/kit/side-panel";
import {
  SelectField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import { TagInput } from "@/components/admin/kit/inputs";
import {
  Callout,
  CopyButton,
  DetailList,
} from "@/components/admin/kit/display";
import { MediaThumb } from "./media-thumb";

/** Large preview: image, video or audio player, or a file tile. */
function Preview({ asset }: { asset: MediaAssetDTO }) {
  if (asset.kind === "VIDEO") {
    return (
      <video
        controls
        preload="metadata"
        poster={thumbnailUrl(asset, 1200) ?? undefined}
        className="aspect-video w-full rounded-[10px] bg-black"
      >
        <source src={asset.url} type={asset.mimeType ?? undefined} />
      </video>
    );
  }
  if (asset.kind === "AUDIO") {
    return (
      <div className="flex flex-col gap-3">
        <MediaThumb asset={asset} className="aspect-[3/1] rounded-[10px]" />
        <audio controls preload="metadata" src={asset.url} className="w-full" />
      </div>
    );
  }
  return (
    <MediaThumb
      asset={asset}
      eager
      width={720}
      fit="contain"
      className="aspect-[4/3] w-full rounded-[10px] ring-1 ring-black/[0.06]"
    />
  );
}

/**
 * Edit one file's details (alt text, title, caption, tags, folder) and see
 * where it's used on the site.
 */
export function MediaDetailsPanel({
  asset,
  folders,
  canEdit,
  onClose,
  onSaved,
  onDelete,
}: {
  asset: MediaAssetDTO | null;
  folders: MediaFolderDTO[];
  canEdit: boolean;
  onClose: () => void;
  onSaved: (asset: MediaAssetDTO) => void;
  onDelete: (asset: MediaAssetDTO) => void;
}) {
  return (
    <SidePanel
      open={!!asset}
      onOpenChange={(o) => !o && onClose()}
      title={asset?.title || asset?.fileName || "File"}
      description={
        asset
          ? `${KIND_LABELS[asset.kind]} · ${formatBytes(asset.bytes)}`
          : undefined
      }
      width="lg"
      footer={
        asset ? (
          <>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="mr-auto text-[#c2410c]!"
                onClick={() => onDelete(asset)}
              >
                <Trash2 aria-hidden className="size-4" /> Delete
              </Button>
            )}
            <Button variant="subtle" size="sm" onClick={onClose}>
              {canEdit ? "Cancel" : "Close"}
            </Button>
            {canEdit && (
              <Button size="sm" type="submit" form="media-details-form">
                Save
              </Button>
            )}
          </>
        ) : null
      }
    >
      {asset && (
        <DetailsBody
          key={asset.id}
          asset={asset}
          folders={folders}
          canEdit={canEdit}
          onSaved={onSaved}
        />
      )}
    </SidePanel>
  );
}

function DetailsBody({
  asset,
  folders,
  canEdit,
  onSaved,
}: {
  asset: MediaAssetDTO;
  folders: MediaFolderDTO[];
  canEdit: boolean;
  onSaved: (asset: MediaAssetDTO) => void;
}) {
  const [alt, setAlt] = useState(asset.alt);
  const [title, setTitle] = useState(asset.title ?? "");
  const [caption, setCaption] = useState(asset.caption ?? "");
  const [tags, setTags] = useState(asset.tags);
  const [folderId, setFolderId] = useState(asset.folderId ?? "");
  const [usage, setUsage] = useState<MediaUsage[] | null>(null);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    let live = true;
    void getMediaUsage(asset.id).then((res) => {
      if (live) setUsage(res.success ? res.usage : []);
    });
    return () => {
      live = false;
    };
  }, [asset.id]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startSaving(async () => {
      const res = await updateMedia(asset.id, {
        alt,
        title: title || null,
        caption: caption || null,
        tags,
        folderId: folderId || null,
      });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success("Details saved");
      onSaved(res.asset);
    });
  };

  const dims =
    asset.width && asset.height ? `${asset.width} × ${asset.height}` : null;

  return (
    <form
      id="media-details-form"
      onSubmit={save}
      className="flex flex-col gap-6"
    >
      <Preview asset={asset} />

      {asset.kind === "IMAGE" && !asset.alt && (
        <Callout tone="warning" title="No alt text yet">
          Describe the image for people using screen readers, and to help it
          show up in search.
        </Callout>
      )}

      <fieldset
        disabled={!canEdit || saving}
        className="flex min-w-0 flex-col gap-5"
      >
        {(asset.kind === "IMAGE" || asset.kind === "VIDEO") && (
          <TextareaField
            label="Alt text"
            rows={2}
            maxLength={300}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            hint="What's in the picture, in a sentence. Leave empty only for purely decorative images."
          />
        )}
        <TextField
          label="Title"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={asset.fileName}
          hint="Only used inside the admin, to find the file."
        />
        <TextareaField
          label="Caption"
          rows={2}
          maxLength={1000}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          hint="Shown under the file where a page supports captions."
        />
        <TagInput
          label="Tags"
          value={tags}
          onChange={(t) => setTags(t.map((x) => x.toLowerCase()))}
          max={30}
        />
        <SelectField
          label="Folder"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          options={[
            { value: "", label: "Unfiled" },
            ...folders.map((f) => ({ value: f.id, label: f.name })),
          ]}
        />
      </fieldset>
      {saving && (
        <p className="text-surface-muted flex items-center gap-2 text-sm">
          <Loader2 aria-hidden className="size-4 animate-spin" /> Saving…
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-bold">Where it&apos;s used</h3>
        {usage === null ? (
          <p className="text-surface-muted flex items-center gap-2 text-sm">
            <Loader2 aria-hidden className="size-4 animate-spin" /> Checking the
            site…
          </p>
        ) : usage.length === 0 ? (
          <p className="text-surface-muted text-sm">
            Not used on any page yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {usage.map((u) => (
              <li
                key={u.label}
                className="flex items-center justify-between gap-3 rounded-[8px] bg-white px-3 py-2.5 text-sm ring-1 ring-black/[0.06]"
              >
                <span>
                  <strong>{u.label}</strong>
                  {u.count > 1 && (
                    <span className="text-surface-muted">
                      {" "}
                      · {u.count} places
                    </span>
                  )}
                </span>
                {u.href && (
                  <Link
                    href={u.href}
                    className="text-royal dx-link text-xs font-bold"
                  >
                    Open
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-bold">File</h3>
        <DetailList
          items={[
            { label: "Type", value: KIND_LABELS[asset.kind] },
            { label: "Size", value: formatBytes(asset.bytes) },
            ...(dims ? [{ label: "Dimensions", value: dims }] : []),
            ...(asset.duration
              ? [{ label: "Length", value: formatDuration(asset.duration) }]
              : []),
            {
              label: "Stored on",
              value:
                asset.storage === "CLOUDINARY"
                  ? "Cloudinary"
                  : "R2 (large files)",
            },
            { label: "Uploaded", value: formatDate(asset.createdAt) },
            ...(asset.uploadedByName
              ? [{ label: "By", value: asset.uploadedByName }]
              : []),
            { label: "File name", value: asset.fileName },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={asset.url} label="Copy link" />
          {asset.storage === "CLOUDINARY" && (
            <CopyButton value={mediaValue(asset)} label="Copy ID" />
          )}
          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-royal hover:bg-ice inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold"
          >
            <ExternalLink aria-hidden className="size-3.5" /> Open original
          </a>
        </div>
      </section>
    </form>
  );
}
