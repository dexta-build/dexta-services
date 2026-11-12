"use client";

import { ImagePlus, Star, Trash2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { stock } from "@/lib/site/stock-media";
import { Button } from "@/components/site/button";
import { StatusPill } from "@/components/admin/kit/layout";
import { IconButton } from "@/components/admin/kit/overlays";
import { TextField } from "@/components/admin/kit/fields";
import { SortableList } from "@/components/admin/kit/sortable-list";
import { Callout } from "@/components/admin/kit/display";
import { MediaValueField } from "@/components/admin/content/media-value-field";

/** A screenshot or video in a template or portal card's gallery. */
export type MediaAsset = {
  id: string;
  publicId: string;
  mediaType: "IMAGE" | "VIDEO";
  thumbnailPublicId: string | null;
  caption: string;
};

type Saved = Omit<MediaAsset, "caption"> & {
  caption: string | null;
  position: number;
};

export const assetsFromRows = (rows: Saved[]): MediaAsset[] =>
  [...rows]
    .sort((a, b) => a.position - b.position)
    .map((a) => ({
      id: a.id,
      publicId: a.publicId,
      mediaType: a.mediaType,
      thumbnailPublicId: a.thumbnailPublicId,
      caption: a.caption ?? "",
    }));

export const assetsToPayload = (assets: MediaAsset[]) =>
  assets.map((a, i) => ({
    id: a.id,
    publicId: a.publicId.trim(),
    mediaType: a.mediaType,
    thumbnailPublicId: a.thumbnailPublicId?.trim() || null,
    caption: a.caption.trim() || null,
    position: i,
  }));

export const coverAsset = <A extends { id: string }>(
  assets: A[],
  coverId: string | null,
) => assets.find((a) => a.id === coverId) ?? assets[0] ?? null;

export function assetPreview(a: {
  mediaType: "IMAGE" | "VIDEO";
  publicId: string;
  thumbnailPublicId: string | null;
}) {
  const id = a.mediaType === "VIDEO" ? a.thumbnailPublicId : a.publicId;
  return id ? stock(id, 320) : "";
}

/** The cover shown in a list row. */
export function AssetThumb({
  asset,
  fallback,
}: {
  asset: Parameters<typeof assetPreview>[0] | null;
  fallback: React.ReactNode;
}) {
  const src = asset ? assetPreview(asset) : "";
  return (
    <span className="bg-canvas relative flex aspect-[4/3] w-16 shrink-0 items-center justify-center overflow-hidden rounded-[8px] ring-1 ring-black/[0.06]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- media library previews
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden className="text-surface-muted [&_svg]:size-5">
          {fallback}
        </span>
      )}
      {asset?.mediaType === "VIDEO" && (
        <Video
          aria-hidden
          className="absolute right-1 bottom-1 size-3.5 text-white drop-shadow"
        />
      )}
    </span>
  );
}

const newId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `asset-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Screenshots and videos with a cover: drag to order, star the cover,
 * videos take a cover image too. Errors use the schema's paths
 * ("assets.0.publicId").
 */
export function MediaAssetsEditor({
  assets,
  coverId,
  onChange,
  errors,
  intro,
  emptyText,
}: {
  assets: MediaAsset[];
  coverId: string | null;
  onChange: (assets: MediaAsset[], coverId: string | null) => void;
  errors: Record<string, string>;
  intro: React.ReactNode;
  emptyText: string;
}) {
  const update = (id: string, p: Partial<MediaAsset>) =>
    onChange(
      assets.map((a) => (a.id === id ? { ...a, ...p } : a)),
      coverId,
    );
  const add = (mediaType: MediaAsset["mediaType"]) => {
    const a: MediaAsset = {
      id: newId(),
      publicId: "",
      mediaType,
      thumbnailPublicId: null,
      caption: "",
    };
    onChange([...assets, a], coverId ?? a.id);
  };
  const remove = (id: string) => {
    const next = assets.filter((a) => a.id !== id);
    onChange(next, coverId === id ? (next[0]?.id ?? null) : coverId);
  };
  const err = (i: number, k: string) => errors[`assets.${i}.${k}`];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-surface-muted text-sm leading-relaxed">{intro}</p>
      {assets.length === 0 && (
        <Callout tone="warning" title="No media yet">
          {emptyText}
        </Callout>
      )}
      <SortableList
        label="Media order"
        items={assets}
        getId={(a) => a.id}
        onReorder={(next) => onChange(next, coverId)}
        renderItem={(a, i) => {
          const isCover = coverId === a.id;
          const video = a.mediaType === "VIDEO";
          return (
            <div className="flex flex-col gap-4 rounded-[10px] bg-white p-4 ring-1 ring-black/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-bold">
                  {video ? (
                    <Video aria-hidden className="size-4" />
                  ) : (
                    <ImagePlus aria-hidden className="size-4" />
                  )}
                  {video ? "Video" : "Screenshot"} {i + 1}
                  {isCover && <StatusPill tone="warning">Cover</StatusPill>}
                </p>
                <span className="flex items-center gap-1">
                  <IconButton
                    size="sm"
                    label={isCover ? "This is the cover" : "Use as cover"}
                    icon={
                      <Star
                        className={cn(isCover && "fill-current text-[#d4a340]")}
                      />
                    }
                    onClick={() => onChange(assets, a.id)}
                  />
                  <IconButton
                    size="sm"
                    tone="danger"
                    label="Remove"
                    icon={<Trash2 />}
                    onClick={() => remove(a.id)}
                  />
                </span>
              </div>
              <div className={cn("grid gap-4", video && "sm:grid-cols-2")}>
                <MediaValueField
                  compact={video}
                  label={video ? "Video" : "Image"}
                  kind={a.mediaType}
                  value={a.publicId}
                  onChange={(v) => update(a.id, { publicId: v })}
                  error={err(i, "publicId")}
                />
                {video && (
                  <MediaValueField
                    compact
                    label="Cover image"
                    value={a.thumbnailPublicId ?? ""}
                    onChange={(v) =>
                      update(a.id, { thumbnailPublicId: v || null })
                    }
                    error={err(i, "thumbnailPublicId")}
                  />
                )}
              </div>
              <TextField
                label="Caption"
                value={a.caption}
                maxLength={300}
                onChange={(e) => update(a.id, { caption: e.target.value })}
                error={err(i, "caption")}
              />
            </div>
          );
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="subtle" onClick={() => add("IMAGE")}>
          <ImagePlus aria-hidden className="size-4" /> Add screenshot
        </Button>
        <Button size="sm" variant="subtle" onClick={() => add("VIDEO")}>
          <Video aria-hidden className="size-4" /> Add video
        </Button>
      </div>
    </div>
  );
}
