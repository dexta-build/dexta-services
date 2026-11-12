"use client";

/**
 * Pieces of the We Brand Schools page: media helpers, the testimonial card
 * and the pop-ups (template preview with zoom, the application form, portal
 * features). Moved from the old page and restyled to the site's design;
 * behaviour is unchanged.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Maximize2,
  Play,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { submitSchoolWebsiteApplication } from "@/app/(public)/webrandschools/actions";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "./ui";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import {
  schoolWebsiteApplicationSchema,
  schoolWebsiteApplicationStepOneSchema,
  schoolWebsiteApplicationStepTwoSchema,
} from "@/lib/validators";
import {
  normalizeHeroRichText,
  type HeroRichTextMode,
} from "@/lib/hero-rich-text";
import type {
  SchoolPortalFeatureAssetData,
  SchoolPortalFeatureCardData,
  SchoolWebsiteTestimonialData,
  SchoolWebsiteTemplateAssetData,
  SchoolWebsiteTemplateData,
} from "@/lib/we-brand-schools-defaults";

export const WE_BRAND_SCHOOLS_HERO_IMAGE_FALLBACK = "/images/school1.jpg";
const TEMPLATE_PREVIEW_MIN_ZOOM = 1;
const TEMPLATE_PREVIEW_MAX_ZOOM = 2.5;
const TEMPLATE_PREVIEW_ZOOM_STEP = 0.25;

function getNextTemplatePreviewZoom(currentZoom: number, delta: number) {
  return Math.min(
    TEMPLATE_PREVIEW_MAX_ZOOM,
    Math.max(
      TEMPLATE_PREVIEW_MIN_ZOOM,
      Number((currentZoom + delta).toFixed(2)),
    ),
  );
}

type TemplatePreviewPanState = {
  pointerId: number;
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
};

function isDirectAssetSource(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

export function resolveImageSource(
  value: string,
  options?: Parameters<typeof getCloudinaryUrl>[1],
) {
  return isDirectAssetSource(value) ? value : getCloudinaryUrl(value, options);
}

type WeBrandSchoolsRichTextProps = {
  as: "div" | "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  mode: HeroRichTextMode;
  value: string;
};

export function WeBrandSchoolsRichText({
  as: Component,
  className,
  mode,
  value,
}: WeBrandSchoolsRichTextProps) {
  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: normalizeHeroRichText(value, mode) }}
    />
  );
}

function resolveVideoPosterSource(publicId: string) {
  if (publicId.startsWith("https://res.cloudinary.com/")) {
    return publicId
      .replace("/video/upload/", "/video/upload/so_0,f_jpg,q_auto/")
      .replace(/\.(mp4|mov|webm)(?:\?.*)?$/i, ".jpg");
  }

  if (isDirectAssetSource(publicId)) {
    return null;
  }

  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/so_0,f_jpg,q_auto/${publicId}.jpg`;
}

function resolveAssetPreview(asset: SchoolWebsiteTemplateAssetData) {
  if (asset.mediaType === "VIDEO") {
    if (asset.thumbnailPublicId) {
      return resolveImageSource(asset.thumbnailPublicId, {
        c: "fit",
        h: 900,
        q: "auto",
        w: 1400,
      });
    }

    return resolveVideoPosterSource(asset.publicId);
  }

  return resolveImageSource(asset.publicId, {
    c: "fit",
    h: 900,
    q: "auto",
    w: 1400,
  });
}

export function resolveTemplateCardPreview(
  template: SchoolWebsiteTemplateData,
) {
  const coverAsset =
    template.assets.find((asset) => asset.id === template.coverAssetId) ??
    template.assets[0] ??
    null;

  if (!coverAsset) {
    return null;
  }

  return resolveAssetPreview(coverAsset);
}

export function resolvePortalCardPreview(card: SchoolPortalFeatureCardData) {
  const coverAsset =
    card.assets.find((asset) => asset.id === card.coverAssetId) ??
    card.assets[0] ??
    null;

  if (!coverAsset) {
    return null;
  }

  return resolveAssetPreview(coverAsset);
}

function resolveFullImageSource(asset: SchoolWebsiteTemplateAssetData) {
  if (asset.mediaType === "VIDEO") {
    return resolveAssetPreview(asset);
  }

  return resolveImageSource(asset.publicId, {
    c: "fit",
    h: 1800,
    q: "auto",
    w: 2400,
  });
}

function getVideoUrl(publicId: string) {
  if (isDirectAssetSource(publicId)) {
    return publicId;
  }

  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/q_auto/${publicId}`;
}

function getYoutubeVideoId(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (hostname === "youtu.be") {
      return pathParts[0] ?? null;
    }

    if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId) {
        return watchId;
      }

      if (["embed", "shorts", "live"].includes(pathParts[0] ?? "")) {
        return pathParts[1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function getSafeYoutubeEmbedUrl(value: string | null) {
  const videoId = getYoutubeVideoId(value);

  if (!videoId || !/^[A-Za-z0-9_-]{6,128}$/.test(videoId)) {
    return null;
  }

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
}

function getSchoolInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function SchoolTestimonialCard({
  testimonial,
  compact = false,
}: {
  testimonial: SchoolWebsiteTestimonialData;
  compact?: boolean;
}) {
  const logoSrc = testimonial.logoPublicId
    ? resolveImageSource(testimonial.logoPublicId, {
        c: "fit",
        h: 360,
        q: "auto",
        w: 420,
      })
    : null;
  const initials = getSchoolInitials(testimonial.schoolName);
  const [logoBroken, setLogoBroken] = useState(false);

  return (
    <article
      className={`grid overflow-hidden rounded-[14px] border border-white/70 bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_100%)] text-royal shadow-[0_24px_64px_-42px_rgba(7,25,63,0.34)] ${
        compact
          ? "h-[214px] w-full max-w-[27rem] grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)]"
          : "h-[238px] w-[min(88vw,27rem)] grid-cols-[minmax(0,0.32fr)_minmax(0,0.68fr)] lg:h-[244px] lg:w-[27.25rem] xl:w-[28rem]"
      }`}
    >
      <div
        className={`flex items-center justify-center border-r border-brand-cyan/55 bg-white ${
          compact ? "p-2" : "p-2.5 md:p-3"
        }`}
      >
        {logoSrc && !logoBroken ? (
          <div
            className={`flex h-full w-full items-center justify-center ${
              compact ? "min-h-[132px]" : "min-h-[158px]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={`${testimonial.schoolName} logo`}
              className="h-full w-full object-contain"
              loading="lazy"
              onError={() => setLogoBroken(true)}
            />
          </div>
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-white font-semibold tracking-[0.18em] text-royal ${
              compact ? "min-h-[132px] text-xl" : "min-h-[158px] text-2xl"
            }`}
          >
            {initials || "SC"}
          </div>
        )}
      </div>

      <div
        className={`flex flex-col ${compact ? "px-3.5 pt-4 pb-7" : "px-4 pt-5 pb-5 sm:px-5 sm:pt-5 sm:pb-6"}`}
      >
        <div>
          <p
            className={`font-semibold uppercase tracking-[0.24em] text-brand-cyan ${
              compact
                ? "line-clamp-2 text-[9px] leading-[1rem]"
                : "text-[10px] sm:text-[11px]"
            }`}
          >
            {testimonial.schoolName}
          </p>
          <p
            className={`text-royal/82 ${
              compact
                ? "mt-2 line-clamp-5 text-[0.76rem] leading-[1.08rem]"
                : "mt-2 line-clamp-6 text-[0.86rem] leading-[1.2rem] lg:text-[0.88rem] lg:leading-[1.25rem]"
            }`}
          >
            “{testimonial.quote}”
          </p>
        </div>

        <div
          className={`mt-auto border-t border-royal/10 ${
            compact ? "pt-3 pb-5" : "pt-4 pb-3"
          }`}
        >
          <p
            className={`font-semibold text-royal ${
              compact ? "line-clamp-1 text-[0.84rem]" : "line-clamp-1 text-sm"
            }`}
          >
            {testimonial.authorName}
          </p>
          <p
            className={`mt-1 font-semibold uppercase tracking-[0.22em] text-royal/56 ${
              compact
                ? "line-clamp-1 text-[9px]"
                : "line-clamp-1 text-[10px] sm:text-[11px]"
            }`}
          >
            {testimonial.authorPosition}
          </p>
        </div>
      </div>
    </article>
  );
}

export function TemplatePreviewDialog({
  template,
  onOpenChange,
  onSelectTemplate,
}: {
  template: SchoolWebsiteTemplateData | null;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: SchoolWebsiteTemplateData) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenAsset, setFullscreenAsset] =
    useState<SchoolWebsiteTemplateAssetData | null>(null);
  const [imageZoom, setImageZoom] = useState(TEMPLATE_PREVIEW_MIN_ZOOM);
  const [fullscreenZoom, setFullscreenZoom] = useState(
    TEMPLATE_PREVIEW_MIN_ZOOM,
  );
  const imagePanStateRef = useRef<TemplatePreviewPanState | null>(null);
  const fullscreenPanStateRef = useRef<TemplatePreviewPanState | null>(null);

  const activeAsset = useMemo(() => {
    if (!template) {
      return null;
    }

    return template.assets[activeIndex] ?? template.assets[0] ?? null;
  }, [activeIndex, template]);

  const previewAssets = template?.assets ?? [];
  const isActiveVideo = activeAsset?.mediaType === "VIDEO";

  const safeSetActiveIndex = useCallback(
    (nextIndex: number) => {
      if (!previewAssets.length) return;
      const normalized =
        nextIndex < 0
          ? previewAssets.length - 1
          : nextIndex >= previewAssets.length
            ? 0
            : nextIndex;
      setActiveIndex(normalized);
    },
    [previewAssets.length],
  );

  useEffect(() => {
    setImageZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
    setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
  }, [activeIndex, template?.id]);

  const createPanStartHandler = useCallback(
    (
      zoom: number,
      panStateRef: MutableRefObject<TemplatePreviewPanState | null>,
    ) =>
      (event: ReactPointerEvent<HTMLDivElement>) => {
        if (zoom <= TEMPLATE_PREVIEW_MIN_ZOOM) return;
        if (event.target instanceof HTMLElement) {
          const interactiveElement = event.target.closest("button, a, video");
          if (interactiveElement) return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        panStateRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          scrollLeft: event.currentTarget.scrollLeft,
          scrollTop: event.currentTarget.scrollTop,
        };
      },
    [],
  );

  const createPanMoveHandler = useCallback(
    (panStateRef: MutableRefObject<TemplatePreviewPanState | null>) =>
      (event: ReactPointerEvent<HTMLDivElement>) => {
        const panState = panStateRef.current;
        if (!panState || panState.pointerId !== event.pointerId) return;

        event.currentTarget.scrollLeft =
          panState.scrollLeft - (event.clientX - panState.startX);
        event.currentTarget.scrollTop =
          panState.scrollTop - (event.clientY - panState.startY);
      },
    [],
  );

  const createPanEndHandler = useCallback(
    (panStateRef: MutableRefObject<TemplatePreviewPanState | null>) =>
      (event: ReactPointerEvent<HTMLDivElement>) => {
        const panState = panStateRef.current;
        if (!panState || panState.pointerId !== event.pointerId) return;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        panStateRef.current = null;
      },
    [],
  );

  const imagePanHandlers = {
    onPointerDown: createPanStartHandler(imageZoom, imagePanStateRef),
    onPointerMove: createPanMoveHandler(imagePanStateRef),
    onPointerUp: createPanEndHandler(imagePanStateRef),
    onPointerCancel: createPanEndHandler(imagePanStateRef),
  };
  const fullscreenPanHandlers = {
    onPointerDown: createPanStartHandler(fullscreenZoom, fullscreenPanStateRef),
    onPointerMove: createPanMoveHandler(fullscreenPanStateRef),
    onPointerUp: createPanEndHandler(fullscreenPanStateRef),
    onPointerCancel: createPanEndHandler(fullscreenPanStateRef),
  };

  return (
    <Dialog
      open={Boolean(template)}
      onOpenChange={(open) => {
        if (!open) {
          setActiveIndex(0);
          setFullscreenAsset(null);
          setImageZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
          setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-hidden border-royal/20 bg-white p-0 text-royal sm:max-w-6xl">
        {template ? (
          <div className="flex h-full max-h-[92vh] flex-col">
            <div className="border-b border-royal/10 bg-white px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="dx-heading font-normal text-3xl tracking-[-0.04em] text-royal">
                  {template.name}
                </DialogTitle>
                <DialogDescription className="mt-2 max-w-3xl text-sm leading-7 text-surface-muted">
                  {template.summary}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1.45fr)_360px]">
                <div className="flex flex-col bg-white">
                  <div className="bg-white">
                    <div
                      className={`relative flex w-full items-center justify-center overflow-hidden ${
                        isActiveVideo
                          ? "aspect-video max-h-[min(68vh,760px)] bg-black sm:max-h-[min(72vh,820px)]"
                          : "h-[min(68vh,760px)] min-h-[360px] bg-white sm:h-[min(72vh,820px)]"
                      }`}
                    >
                      {activeAsset ? (
                        activeAsset.mediaType === "VIDEO" ? (
                          <video
                            src={getVideoUrl(activeAsset.publicId)}
                            controls
                            playsInline
                            className="block h-full w-full object-contain"
                            poster={
                              activeAsset.thumbnailPublicId
                                ? resolveImageSource(
                                    activeAsset.thumbnailPublicId,
                                    {
                                      c: "fit",
                                      h: 900,
                                      q: "auto",
                                      w: 1400,
                                    },
                                  )
                                : (resolveVideoPosterSource(
                                    activeAsset.publicId,
                                  ) ?? undefined)
                            }
                          />
                        ) : (
                          <div
                            className={`h-full w-full overflow-auto overscroll-contain ${
                              imageZoom > TEMPLATE_PREVIEW_MIN_ZOOM
                                ? "cursor-grab active:cursor-grabbing"
                                : "cursor-zoom-in"
                            }`}
                            role="button"
                            tabIndex={0}
                            aria-label={`Open ${template.name} preview fullscreen`}
                            onClick={() => {
                              if (imageZoom > TEMPLATE_PREVIEW_MIN_ZOOM) {
                                return;
                              }

                              setFullscreenAsset(activeAsset);
                              setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ") {
                                return;
                              }

                              event.preventDefault();
                              setFullscreenAsset(activeAsset);
                              setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
                            }}
                            {...imagePanHandlers}
                          >
                            <div
                              className="flex min-h-full min-w-full items-center justify-center transition-[height,width] duration-200"
                              style={{
                                height: `${imageZoom * 100}%`,
                                width: `${imageZoom * 100}%`,
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={resolveImageSource(activeAsset.publicId, {
                                  c: "fit",
                                  h: 1200,
                                  q: "auto",
                                  w: 1800,
                                })}
                                alt={template.name}
                                className="h-full w-full select-none object-contain"
                                draggable={false}
                              />
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex h-full items-center justify-center bg-white">
                          <p className="px-6 text-center text-sm text-surface-muted">
                            Preview media will appear here once template assets
                            are added.
                          </p>
                        </div>
                      )}

                      {previewAssets.length > 1 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => safeSetActiveIndex(activeIndex - 1)}
                            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-royal/12 bg-white/90 text-royal transition hover:bg-white"
                            aria-label="Previous preview"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => safeSetActiveIndex(activeIndex + 1)}
                            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-royal/12 bg-white/90 text-royal transition hover:bg-white"
                            aria-label="Next preview"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      ) : null}

                      {activeAsset?.mediaType === "IMAGE" ? (
                        <>
                          <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full border border-royal/12 bg-white/90 p-1 text-royal shadow-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setImageZoom((currentZoom) =>
                                  getNextTemplatePreviewZoom(
                                    currentZoom,
                                    -TEMPLATE_PREVIEW_ZOOM_STEP,
                                  ),
                                )
                              }
                              disabled={imageZoom <= TEMPLATE_PREVIEW_MIN_ZOOM}
                              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-royal/8 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Zoom image out"
                            >
                              <ZoomOut className="h-4 w-4" />
                            </button>
                            <span className="min-w-12 text-center text-xs font-semibold">
                              {Math.round(imageZoom * 100)}%
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setImageZoom((currentZoom) =>
                                  getNextTemplatePreviewZoom(
                                    currentZoom,
                                    TEMPLATE_PREVIEW_ZOOM_STEP,
                                  ),
                                )
                              }
                              disabled={imageZoom >= TEMPLATE_PREVIEW_MAX_ZOOM}
                              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-royal/8 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Zoom image in"
                            >
                              <ZoomIn className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setImageZoom(TEMPLATE_PREVIEW_MIN_ZOOM)
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-royal/8"
                              aria-label="Reset image zoom"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFullscreenAsset(activeAsset);
                              setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
                            }}
                            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-royal/12 bg-white/90 text-royal transition hover:bg-white"
                            aria-label="Open fullscreen preview"
                          >
                            <Maximize2 className="h-5 w-5" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {previewAssets.length > 1 ? (
                    <div className="flex gap-3 overflow-x-auto border-t border-royal/10 px-4 py-4 sm:px-6">
                      {previewAssets.map((asset, index) => {
                        const previewSrc = resolveAssetPreview(asset);
                        return (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={`group relative h-24 w-40 shrink-0 overflow-hidden rounded-[10px] border bg-white transition ${
                              index === activeIndex
                                ? "border-royal ring-2 ring-royal/10"
                                : "border-royal/10"
                            }`}
                          >
                            {previewSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewSrc}
                                alt={`${template.name} preview ${index + 1}`}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-white text-surface-muted">
                                No media
                              </div>
                            )}
                            {asset.mediaType === "VIDEO" ? (
                              <span className="absolute right-2 top-2 rounded-full bg-royal p-1 text-white">
                                <Play className="h-3 w-3 fill-current" />
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <aside className="hidden border-l border-royal/10 bg-white lg:block">
                  <div className="sticky top-0 space-y-6 p-6">
                    <div className="rounded-[14px] border border-royal/10 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                        Selected template
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-royal">
                        {template.name}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-charcoal/80">
                        {template.description ??
                          "This template is ready for school-specific branding, content, and launch preparation."}
                      </p>

                      <div className="mt-5 flex flex-col gap-3">
                        <Button
                          type="button"
                          onClick={() => onSelectTemplate(template)}
                          className="h-11 rounded-full bg-royal text-sm font-semibold text-white hover:bg-brand"
                        >
                          Select Template
                        </Button>

                        {template.websiteUrl ? (
                          <a
                            href={template.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              className="h-11 w-full rounded-full border-royal/12 bg-white text-sm font-semibold text-royal hover:bg-royal hover:text-white"
                            >
                              Preview Live Site
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          </a>
                        ) : null}
                      </div>
                    </div>

                    {template.highlights.length ? (
                      <div className="rounded-[14px] border border-royal/10 bg-white p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                          Highlights
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {template.highlights.map((highlight) => (
                            <span
                              key={highlight}
                              className="rounded-full border border-royal/12 bg-white px-3 py-1 text-xs text-royal"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[14px] border border-royal/10 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                        Preview assets
                      </p>
                      <div className="mt-4 grid gap-3 text-sm text-charcoal/80">
                        <div className="flex items-center justify-between">
                          <span>Total media</span>
                          <span className="font-semibold text-royal">
                            {template.assets.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Videos</span>
                          <span className="font-semibold text-royal">
                            {
                              template.assets.filter(
                                (asset) => asset.mediaType === "VIDEO",
                              ).length
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Images</span>
                          <span className="font-semibold text-royal">
                            {
                              template.assets.filter(
                                (asset) => asset.mediaType === "IMAGE",
                              ).length
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            {fullscreenAsset ? (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-royal/96 p-4 sm:p-6">
                <button
                  type="button"
                  onClick={() => {
                    setFullscreenAsset(null);
                    setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
                  }}
                  className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-royal"
                  aria-label="Close fullscreen preview"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 text-white shadow-sm backdrop-blur">
                  <button
                    type="button"
                    onClick={() =>
                      setFullscreenZoom((currentZoom) =>
                        getNextTemplatePreviewZoom(
                          currentZoom,
                          -TEMPLATE_PREVIEW_ZOOM_STEP,
                        ),
                      )
                    }
                    disabled={fullscreenZoom <= TEMPLATE_PREVIEW_MIN_ZOOM}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Zoom fullscreen image out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="min-w-12 text-center text-xs font-semibold">
                    {Math.round(fullscreenZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFullscreenZoom((currentZoom) =>
                        getNextTemplatePreviewZoom(
                          currentZoom,
                          TEMPLATE_PREVIEW_ZOOM_STEP,
                        ),
                      )
                    }
                    disabled={fullscreenZoom >= TEMPLATE_PREVIEW_MAX_ZOOM}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Zoom fullscreen image in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM)}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/15"
                    aria-label="Reset fullscreen image zoom"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
                <div
                  className={`h-full w-full overflow-auto overscroll-contain pt-16 ${
                    fullscreenZoom > TEMPLATE_PREVIEW_MIN_ZOOM
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-default"
                  }`}
                  {...fullscreenPanHandlers}
                >
                  <div
                    className="flex min-h-full min-w-full items-center justify-center transition-[height,width] duration-200"
                    style={{
                      height: `${fullscreenZoom * 100}%`,
                      width: `${fullscreenZoom * 100}%`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveFullImageSource(fullscreenAsset) ?? ""}
                      alt={`${template.name} fullscreen preview`}
                      className="h-full w-full select-none object-contain"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="border-t border-royal/10 bg-white px-4 py-3 lg:hidden">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  onClick={() => onSelectTemplate(template)}
                  className="h-10 rounded-full bg-royal px-5 text-sm font-semibold text-white hover:bg-brand"
                >
                  Select
                </Button>
                {template.websiteUrl ? (
                  <a
                    href={template.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full rounded-full border-royal/12 bg-white px-5 text-sm font-semibold text-royal hover:bg-royal hover:text-white"
                    >
                      Preview Live Site
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function TemplateApplicationDialog({
  template,
  onOpenChange,
}: {
  template: SchoolWebsiteTemplateData | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [hasViewedTerms, setHasViewedTerms] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const form = useForm({
    resolver: zodResolver(schoolWebsiteApplicationSchema),
    mode: "onTouched",
    defaultValues: {
      templateId: template?.id ?? null,
      selectedTemplateName: template?.name ?? "",
      schoolName: "",
      aboutSchool: "",
      vision: "",
      mission: "",
      coreValues: "",
      officialPhone: "",
      officialEmail: "",
      officialAddress: "",
      officialWebsiteUrl: "",
      officialContactName: "",
      officialContactRole: "",
      officialContactPhone: "",
      officialContactEmail: "",
      domainChoice: undefined,
      existingDomain: "",
      preferredDomain1: "",
      preferredDomain2: "",
      status: "PENDING",
      adminNotes: "",
      hp_school_website: "",
    },
  });

  const domainChoice = form.watch("domainChoice");

  const resetForTemplate = useCallback(() => {
    form.reset({
      templateId: template?.id ?? null,
      selectedTemplateName: template?.name ?? "",
      schoolName: "",
      aboutSchool: "",
      vision: "",
      mission: "",
      coreValues: "",
      officialPhone: "",
      officialEmail: "",
      officialAddress: "",
      officialWebsiteUrl: "",
      officialContactName: "",
      officialContactRole: "",
      officialContactPhone: "",
      officialContactEmail: "",
      domainChoice: undefined,
      existingDomain: "",
      preferredDomain1: "",
      preferredDomain2: "",
      status: "PENDING",
      adminNotes: "",
      hp_school_website: "",
    });
    setStep(1);
    setIsSuccess(false);
    setIsTermsOpen(false);
    setHasViewedTerms(false);
    setHasAcceptedTerms(false);
  }, [form, template?.id, template?.name]);

  useEffect(() => {
    if (template) {
      resetForTemplate();
    }
  }, [resetForTemplate, template]);

  const handleStepOneNext = useCallback(async () => {
    form.clearErrors();
    const values = form.getValues();
    const parsed = schoolWebsiteApplicationStepOneSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string") {
          form.setError(path as keyof typeof form.formState.defaultValues, {
            type: "manual",
            message: issue.message,
          });
        }
      }
      return;
    }

    setStep(2);
  }, [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const parsed = schoolWebsiteApplicationStepTwoSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string") {
          form.setError(path as keyof typeof form.formState.defaultValues, {
            type: "manual",
            message: issue.message,
          });
        }
      }
      return;
    }

    let recaptchaToken: string | undefined;
    if (executeRecaptcha) {
      recaptchaToken = await executeRecaptcha("school_website_application");
    }

    const payloadResult = schoolWebsiteApplicationSchema.safeParse({
      ...values,
      templateId: template?.id ?? null,
      selectedTemplateName: template?.name ?? values.selectedTemplateName,
    });

    if (!payloadResult.success) {
      toast.error(
        payloadResult.error.issues[0]?.message ??
          "Please review the form and try again.",
      );
      return;
    }

    const result = await submitSchoolWebsiteApplication(
      payloadResult.data,
      recaptchaToken,
    );

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setIsSuccess(true);
  });

  return (
    <>
      <Dialog
        open={Boolean(template)}
        onOpenChange={(open) => {
          if (!open) {
            resetForTemplate();
          }
          onOpenChange(open);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-hidden border-royal/20 bg-white p-0 text-royal sm:max-w-3xl">
          {template ? (
            <div className="flex max-h-[92vh] flex-col">
              <div className="border-b border-royal/10 bg-white px-6 py-5">
                <DialogHeader className="text-left">
                  <DialogTitle className="dx-heading font-normal text-3xl tracking-[-0.04em] text-royal">
                    Apply for {template.name}
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                {isSuccess ? (
                  <div className="rounded-[14px] border border-emerald-500/20 bg-white p-8 text-center">
                    <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
                    <h3 className="mt-4 dx-heading font-normal text-3xl tracking-[-0.04em] text-royal">
                      Application received
                    </h3>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-charcoal/80">
                      Your school website request for{" "}
                      <strong>{template.name}</strong> has been submitted
                      successfully. Our team will review the details and follow
                      up using the official contact information you provided.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <Button
                        type="button"
                        onClick={() => {
                          resetForTemplate();
                          onOpenChange(false);
                        }}
                        className="h-11 rounded-full bg-royal px-6 text-sm font-semibold text-white hover:bg-brand"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} noValidate>
                    {/* Honeypot & Timing Trap for bot detection */}
                    <div
                      className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0 pointer-events-none select-none"
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      <label htmlFor="hp_school_website">
                        Leave this field blank
                      </label>
                      <input
                        type="text"
                        id="hp_school_website"
                        {...form.register("hp_school_website")}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                      <input
                        type="hidden"
                        {...form.register("_form_ts")}
                        defaultValue={Date.now()}
                      />
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                      {step === 1 ? (
                        <motion.div
                          key="step-1"
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -24 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6"
                        >
                          <div className="grid gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                              <Label
                                htmlFor="schoolName"
                                className="mb-2 block text-sm"
                              >
                                School name
                              </Label>
                              <Input
                                id="schoolName"
                                placeholder="Enter your school name"
                                className="h-11 rounded-[10px] border-royal/12 bg-white"
                                {...form.register("schoolName")}
                              />
                              {form.formState.errors.schoolName ? (
                                <p className="mt-2 text-xs text-red-500">
                                  {form.formState.errors.schoolName.message}
                                </p>
                              ) : null}
                            </div>

                            <div className="md:col-span-2">
                              <Label
                                htmlFor="aboutSchool"
                                className="mb-2 block text-sm"
                              >
                                About your school
                              </Label>
                              <Textarea
                                id="aboutSchool"
                                placeholder="Tell us about your school, audience, and what it stands for"
                                className="min-h-32 rounded-[14px] border-royal/12 bg-white"
                                {...form.register("aboutSchool")}
                              />
                              {form.formState.errors.aboutSchool ? (
                                <p className="mt-2 text-xs text-red-500">
                                  {form.formState.errors.aboutSchool.message}
                                </p>
                              ) : null}
                            </div>

                            <div>
                              <Label
                                htmlFor="vision"
                                className="mb-2 block text-sm"
                              >
                                Vision
                              </Label>
                              <Textarea
                                id="vision"
                                placeholder="Your school vision"
                                className="min-h-28 rounded-[14px] border-royal/12 bg-white"
                                {...form.register("vision")}
                              />
                              {form.formState.errors.vision ? (
                                <p className="mt-2 text-xs text-red-500">
                                  {form.formState.errors.vision.message}
                                </p>
                              ) : null}
                            </div>

                            <div>
                              <Label
                                htmlFor="mission"
                                className="mb-2 block text-sm"
                              >
                                Mission
                              </Label>
                              <Textarea
                                id="mission"
                                placeholder="Your school mission"
                                className="min-h-28 rounded-[14px] border-royal/12 bg-white"
                                {...form.register("mission")}
                              />
                              {form.formState.errors.mission ? (
                                <p className="mt-2 text-xs text-red-500">
                                  {form.formState.errors.mission.message}
                                </p>
                              ) : null}
                            </div>

                            <div className="md:col-span-2">
                              <Label
                                htmlFor="coreValues"
                                className="mb-2 block text-sm"
                              >
                                Core values
                              </Label>
                              <Textarea
                                id="coreValues"
                                placeholder="List the core values that define your school"
                                className="min-h-28 rounded-[14px] border-royal/12 bg-white"
                                {...form.register("coreValues")}
                              />
                              {form.formState.errors.coreValues ? (
                                <p className="mt-2 text-xs text-red-500">
                                  {form.formState.errors.coreValues.message}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="rounded-[14px] border border-royal/10 bg-white p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                              Official contact detail
                            </p>
                            <div className="mt-5 grid gap-5 md:grid-cols-2">
                              <div>
                                <Label
                                  htmlFor="officialPhone"
                                  className="mb-2 block text-sm"
                                >
                                  Official phone
                                </Label>
                                <Input
                                  id="officialPhone"
                                  placeholder="+234..."
                                  className="h-11 rounded-[10px] border-royal/12 bg-white"
                                  {...form.register("officialPhone")}
                                />
                                {form.formState.errors.officialPhone ? (
                                  <p className="mt-2 text-xs text-red-500">
                                    {
                                      form.formState.errors.officialPhone
                                        .message
                                    }
                                  </p>
                                ) : null}
                              </div>

                              <div>
                                <Label
                                  htmlFor="officialEmail"
                                  className="mb-2 block text-sm"
                                >
                                  Official email
                                </Label>
                                <Input
                                  id="officialEmail"
                                  type="email"
                                  placeholder="school@example.com"
                                  className="h-11 rounded-[10px] border-royal/12 bg-white"
                                  {...form.register("officialEmail")}
                                />
                                {form.formState.errors.officialEmail ? (
                                  <p className="mt-2 text-xs text-red-500">
                                    {
                                      form.formState.errors.officialEmail
                                        .message
                                    }
                                  </p>
                                ) : null}
                              </div>

                              <div className="md:col-span-2">
                                <Label
                                  htmlFor="officialAddress"
                                  className="mb-2 block text-sm"
                                >
                                  Official address
                                </Label>
                                <Textarea
                                  id="officialAddress"
                                  placeholder="Enter the school address"
                                  className="min-h-24 rounded-[14px] border-royal/12 bg-white"
                                  {...form.register("officialAddress")}
                                />
                                {form.formState.errors.officialAddress ? (
                                  <p className="mt-2 text-xs text-red-500">
                                    {
                                      form.formState.errors.officialAddress
                                        .message
                                    }
                                  </p>
                                ) : null}
                              </div>

                              <div className="md:col-span-2">
                                <Label
                                  htmlFor="officialWebsiteUrl"
                                  className="mb-2 block text-sm"
                                >
                                  Current website or social link
                                </Label>
                                <Input
                                  id="officialWebsiteUrl"
                                  placeholder="https://"
                                  className="h-11 rounded-[10px] border-royal/12 bg-white"
                                  {...form.register("officialWebsiteUrl")}
                                />
                                {form.formState.errors.officialWebsiteUrl ? (
                                  <p className="mt-2 text-xs text-red-500">
                                    {
                                      form.formState.errors.officialWebsiteUrl
                                        .message
                                    }
                                  </p>
                                ) : null}
                              </div>

                              <div>
                                <Label
                                  htmlFor="officialContactName"
                                  className="mb-2 block text-sm"
                                >
                                  Contact person name
                                </Label>
                                <Input
                                  id="officialContactName"
                                  placeholder="Name of school representative"
                                  className="h-11 rounded-[10px] border-royal/12 bg-white"
                                  {...form.register("officialContactName")}
                                />
                                {form.formState.errors.officialContactName ? (
                                  <p className="mt-2 text-xs text-red-500">
                                    {
                                      form.formState.errors.officialContactName
                                        .message
                                    }
                                  </p>
                                ) : null}
                              </div>

                              <div>
                                <Label
                                  htmlFor="officialContactRole"
                                  className="mb-2 block text-sm"
                                >
                                  Contact person role
                                </Label>
                                <Input
                                  id="officialContactRole"
                                  placeholder="Principal, admin officer, founder..."
                                  className="h-11 rounded-[10px] border-royal/12 bg-white"
                                  {...form.register("officialContactRole")}
                                />
                                {form.formState.errors.officialContactRole ? (
                                  <p className="mt-2 text-xs text-red-500">
                                    {
                                      form.formState.errors.officialContactRole
                                        .message
                                    }
                                  </p>
                                ) : null}
                              </div>

                              <div>
                                <Label
                                  htmlFor="officialContactPhone"
                                  className="mb-2 block text-sm"
                                >
                                  Contact person phone
                                </Label>
                                <Input
                                  id="officialContactPhone"
                                  placeholder="+234..."
                                  className="h-11 rounded-[10px] border-royal/12 bg-white"
                                  {...form.register("officialContactPhone")}
                                />
                                {form.formState.errors.officialContactPhone ? (
                                  <p className="mt-2 text-xs text-red-500">
                                    {
                                      form.formState.errors.officialContactPhone
                                        .message
                                    }
                                  </p>
                                ) : null}
                              </div>

                              <div>
                                <Label
                                  htmlFor="officialContactEmail"
                                  className="mb-2 block text-sm"
                                >
                                  Contact person email
                                </Label>
                                <Input
                                  id="officialContactEmail"
                                  type="email"
                                  placeholder="contact@example.com"
                                  className="h-11 rounded-[10px] border-royal/12 bg-white"
                                  {...form.register("officialContactEmail")}
                                />
                                {form.formState.errors.officialContactEmail ? (
                                  <p className="mt-2 text-xs text-red-500">
                                    {
                                      form.formState.errors.officialContactEmail
                                        .message
                                    }
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="step-2"
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -24 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6"
                        >
                          <div className="rounded-[14px] border border-royal/10 bg-white p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                              Domain setup
                            </p>
                            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-royal">
                              Do you already have a domain name?
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-charcoal/80">
                              Choose the option that matches your school's
                              current domain situation so we can guide the next
                              stage properly.
                            </p>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                              <button
                                type="button"
                                onClick={() =>
                                  form.setValue("domainChoice", "HAS_DOMAIN", {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                  })
                                }
                                className={`rounded-[14px] border px-5 py-5 text-left transition ${
                                  domainChoice === "HAS_DOMAIN"
                                    ? "border-royal bg-white text-royal"
                                    : "border-royal/10 bg-white text-royal"
                                }`}
                              >
                                <p className="text-sm font-semibold">
                                  Yes, we already have one
                                </p>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  form.setValue(
                                    "domainChoice",
                                    "NEEDS_DOMAIN",
                                    {
                                      shouldDirty: true,
                                      shouldTouch: true,
                                      shouldValidate: true,
                                    },
                                  )
                                }
                                className={`rounded-[14px] border px-5 py-5 text-left transition ${
                                  domainChoice === "NEEDS_DOMAIN"
                                    ? "border-royal bg-white text-royal"
                                    : "border-royal/10 bg-white text-royal"
                                }`}
                              >
                                <p className="text-sm font-semibold">
                                  No, we need one
                                </p>
                              </button>
                            </div>

                            {form.formState.errors.domainChoice ? (
                              <p className="mt-3 text-xs text-red-500">
                                {form.formState.errors.domainChoice.message}
                              </p>
                            ) : null}

                            {domainChoice === "HAS_DOMAIN" ? (
                              <div className="mt-5">
                                <Label
                                  htmlFor="existingDomain"
                                  className="mb-2 block text-sm"
                                >
                                  Current domain name
                                </Label>
                                <Input
                                  id="existingDomain"
                                  placeholder="example.edu.ng"
                                  className="h-11 rounded-[10px] border-royal/12 bg-white"
                                  {...form.register("existingDomain")}
                                />
                                {form.formState.errors.existingDomain ? (
                                  <p className="mt-2 text-xs text-red-500">
                                    {
                                      form.formState.errors.existingDomain
                                        .message
                                    }
                                  </p>
                                ) : null}
                              </div>
                            ) : domainChoice === "NEEDS_DOMAIN" ? (
                              <div className="mt-5 grid gap-5 md:grid-cols-2">
                                <div>
                                  <Label
                                    htmlFor="preferredDomain1"
                                    className="mb-2 block text-sm"
                                  >
                                    Preferred domain name
                                  </Label>
                                  <Input
                                    id="preferredDomain1"
                                    placeholder="first-choice-school.edu.ng"
                                    className="h-11 rounded-[10px] border-royal/12 bg-white"
                                    {...form.register("preferredDomain1")}
                                  />
                                  {form.formState.errors.preferredDomain1 ? (
                                    <p className="mt-2 text-xs text-red-500">
                                      {
                                        form.formState.errors.preferredDomain1
                                          .message
                                      }
                                    </p>
                                  ) : null}
                                </div>

                                <div>
                                  <Label
                                    htmlFor="preferredDomain2"
                                    className="mb-2 block text-sm"
                                  >
                                    Second preferred domain name
                                  </Label>
                                  <Input
                                    id="preferredDomain2"
                                    placeholder="backup-choice-school.edu.ng"
                                    className="h-11 rounded-[10px] border-royal/12 bg-white"
                                    {...form.register("preferredDomain2")}
                                  />
                                  {form.formState.errors.preferredDomain2 ? (
                                    <p className="mt-2 text-xs text-red-500">
                                      {
                                        form.formState.errors.preferredDomain2
                                          .message
                                      }
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}

                            <div className="mt-6 rounded-[14px] border border-royal/10 bg-canvas p-5">
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                                Terms acceptance
                              </p>
                              <p className="mt-3 text-sm leading-7 text-charcoal/80">
                                Please review the terms for this offer before
                                you submit your application.
                              </p>

                              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHasViewedTerms(true);
                                    setIsTermsOpen(true);
                                  }}
                                  className="inline-flex h-10 items-center justify-center rounded-full border border-royal/12 bg-white px-5 text-sm font-semibold text-royal transition hover:bg-royal hover:text-white"
                                >
                                  Read Terms and Conditions
                                </button>

                                <div className="rounded-full bg-white px-4 py-2 text-xs text-surface-muted">
                                  {hasViewedTerms
                                    ? "Terms opened"
                                    : "Review available"}
                                </div>
                              </div>

                              <div className="mt-4 flex items-start gap-3 rounded-[14px] border border-royal/10 bg-white p-4">
                                <Checkbox
                                  id="termsAgreement"
                                  checked={hasAcceptedTerms}
                                  onCheckedChange={(checked) =>
                                    setHasAcceptedTerms(checked === true)
                                  }
                                  className="mt-0.5 border-royal/30 data-[state=checked]:border-royal data-[state=checked]:bg-royal"
                                />
                                <div className="space-y-1">
                                  <Label
                                    htmlFor="termsAgreement"
                                    className="cursor-pointer text-sm font-medium text-royal"
                                  >
                                    I have read and agree to the Terms and
                                    Conditions
                                  </Label>
                                  <p className="text-xs leading-6 text-surface-muted">
                                    You can review the terms above at any time
                                    before submitting this application.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                )}
              </div>

              {!isSuccess ? (
                <div className="border-t border-royal/10 bg-white px-6 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-royal">
                        Template: {template.name}
                      </p>
                      <p className="text-xs text-surface-muted">
                        Step {step} of 2
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      {step === 2 ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="h-11 rounded-full border-royal/12 bg-white px-6 text-sm font-semibold text-royal hover:bg-royal hover:text-white"
                        >
                          Back
                        </Button>
                      ) : null}

                      {step === 1 ? (
                        <Button
                          type="button"
                          onClick={handleStepOneNext}
                          className="h-11 rounded-full bg-royal px-6 text-sm font-semibold text-white hover:bg-brand"
                        >
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={onSubmit}
                          disabled={
                            form.formState.isSubmitting || !hasAcceptedTerms
                          }
                          className="h-11 rounded-full bg-royal px-6 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
                        >
                          {form.formState.isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              Submit application
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-royal/20 bg-white text-royal sm:max-w-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="dx-heading font-normal text-3xl tracking-[-0.04em] text-royal">
              Terms and Conditions
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-7 text-surface-muted">
              These terms apply to the We Brand Schools free website offer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 text-sm leading-7 text-charcoal/80">
            <div>
              <p className="font-semibold text-royal">1. Free website build</p>
              <p>
                Dexta will build a template-based school website for your school
                under this offer at no website development charge.
              </p>
            </div>

            <div>
              <p className="font-semibold text-royal">
                2. Domain and hosting are paid by the school
              </p>
              <p>
                The school is responsible for paying for its domain name and
                hosting. These are not included for free under this offer.
              </p>
            </div>

            <div>
              <p className="font-semibold text-royal">
                3. No free domain or hosting obligation
              </p>
              <p>
                Dexta is not responsible for providing free domain registration
                or free hosting for any school. If setup guidance is given, the
                actual third-party costs must still be paid by the school.
              </p>
            </div>

            <div>
              <p className="font-semibold text-royal">
                4. Template-based delivery only
              </p>
              <p>
                The website will be created from an approved template and
                adapted with your school&apos;s name, content, branding, and
                contact details.
              </p>
            </div>

            <div>
              <p className="font-semibold text-royal">
                5. Content responsibility
              </p>
              <p>
                Your school is responsible for submitting accurate content,
                approved branding assets, and correct official contact
                information.
              </p>
            </div>

            <div>
              <p className="font-semibold text-royal">6. Review and launch</p>
              <p>
                Dexta may review each request before launch and may pause or
                decline progress if required information, approvals, or domain
                and hosting payments are not in place.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PortalFeaturePreviewDialog({
  card,
  onOpenChange,
}: {
  card: SchoolPortalFeatureCardData | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [imageZoom, setImageZoom] = useState(TEMPLATE_PREVIEW_MIN_ZOOM);
  const [fullscreenAsset, setFullscreenAsset] =
    useState<SchoolPortalFeatureAssetData | null>(null);
  const [fullscreenZoom, setFullscreenZoom] = useState(
    TEMPLATE_PREVIEW_MIN_ZOOM,
  );
  const imagePanStateRef = useRef<TemplatePreviewPanState | null>(null);
  const fullscreenPanStateRef = useRef<TemplatePreviewPanState | null>(null);
  const coverAsset =
    card?.assets.find((asset) => asset.id === card.coverAssetId) ??
    card?.assets[0] ??
    null;
  const [activeAssetId, setActiveAssetId] = useState<string | null>(
    coverAsset?.id ?? null,
  );
  const galleryAssets = card?.assets ?? [];
  const activeAsset =
    galleryAssets.find((asset) => asset.id === activeAssetId) ??
    coverAsset ??
    galleryAssets[0] ??
    null;
  const activeAssetPreview = activeAsset
    ? resolveAssetPreview(activeAsset)
    : null;

  useEffect(() => {
    setActiveAssetId(coverAsset?.id ?? card?.assets[0]?.id ?? null);
    setImageZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
    setFullscreenAsset(null);
    setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
  }, [card?.id, coverAsset?.id, card?.assets]);

  useEffect(() => {
    setImageZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
    setFullscreenAsset(null);
    setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
  }, [activeAsset?.id]);

  const createPanStartHandler = useCallback(
    (
      zoom: number,
      panStateRef: MutableRefObject<TemplatePreviewPanState | null>,
    ) =>
      (event: ReactPointerEvent<HTMLDivElement>) => {
        if (zoom <= TEMPLATE_PREVIEW_MIN_ZOOM) return;
        if (event.target instanceof HTMLElement) {
          const interactiveElement = event.target.closest("button, a, video");
          if (interactiveElement) return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        panStateRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          scrollLeft: event.currentTarget.scrollLeft,
          scrollTop: event.currentTarget.scrollTop,
        };
      },
    [],
  );

  const createPanMoveHandler = useCallback(
    (panStateRef: MutableRefObject<TemplatePreviewPanState | null>) =>
      (event: ReactPointerEvent<HTMLDivElement>) => {
        const panState = panStateRef.current;
        if (!panState || panState.pointerId !== event.pointerId) return;

        event.currentTarget.scrollLeft =
          panState.scrollLeft - (event.clientX - panState.startX);
        event.currentTarget.scrollTop =
          panState.scrollTop - (event.clientY - panState.startY);
      },
    [],
  );

  const createPanEndHandler = useCallback(
    (panStateRef: MutableRefObject<TemplatePreviewPanState | null>) =>
      (event: ReactPointerEvent<HTMLDivElement>) => {
        const panState = panStateRef.current;
        if (!panState || panState.pointerId !== event.pointerId) return;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        panStateRef.current = null;
      },
    [],
  );

  const imagePanHandlers = {
    onPointerDown: createPanStartHandler(imageZoom, imagePanStateRef),
    onPointerMove: createPanMoveHandler(imagePanStateRef),
    onPointerUp: createPanEndHandler(imagePanStateRef),
    onPointerCancel: createPanEndHandler(imagePanStateRef),
  };
  const fullscreenPanHandlers = {
    onPointerDown: createPanStartHandler(fullscreenZoom, fullscreenPanStateRef),
    onPointerMove: createPanMoveHandler(fullscreenPanStateRef),
    onPointerUp: createPanEndHandler(fullscreenPanStateRef),
    onPointerCancel: createPanEndHandler(fullscreenPanStateRef),
  };

  return (
    <Dialog
      open={Boolean(card)}
      onOpenChange={(open) => {
        if (!open) {
          setImageZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
          setFullscreenAsset(null);
          setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent
        className={
          fullscreenAsset
            ? "fixed inset-0 left-0 top-0 z-[100] h-screen max-h-screen w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 bg-white p-0 text-royal shadow-none sm:max-w-none"
            : "max-h-[92vh] overflow-hidden border-royal/20 bg-white p-0 text-royal sm:max-w-6xl"
        }
        showCloseButton={!fullscreenAsset}
        onInteractOutside={(event) => {
          if (fullscreenAsset) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (fullscreenAsset) {
            event.preventDefault();
          }
        }}
      >
        {card ? (
          <div>
            <div className="grid gap-0 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
              <div className="bg-canvas p-5 sm:p-6">
                <div className="relative overflow-hidden rounded-lg border border-royal/10 bg-white">
                  {activeAsset?.mediaType === "VIDEO" ? (
                    <video
                      src={getVideoUrl(activeAsset.publicId)}
                      poster={activeAssetPreview ?? undefined}
                      controls
                      preload="metadata"
                      className="h-[280px] w-full bg-royal object-contain sm:h-[360px]"
                    />
                  ) : activeAssetPreview ? (
                    <>
                      <div
                        className={`h-[280px] w-full overscroll-contain bg-white sm:h-[360px] ${
                          imageZoom > TEMPLATE_PREVIEW_MIN_ZOOM
                            ? "overflow-auto cursor-grab active:cursor-grabbing"
                            : "overflow-hidden cursor-zoom-in"
                        }`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open ${card.title} preview fullscreen`}
                        onClick={() => {
                          if (imageZoom > TEMPLATE_PREVIEW_MIN_ZOOM) {
                            return;
                          }

                          setFullscreenAsset(activeAsset);
                          setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") {
                            return;
                          }

                          event.preventDefault();
                          setFullscreenAsset(activeAsset);
                          setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
                        }}
                        {...imagePanHandlers}
                      >
                        <div
                          className="flex min-h-full min-w-full items-center justify-center transition-[height,width] duration-200"
                          style={{
                            height: `${imageZoom * 100}%`,
                            width: `${imageZoom * 100}%`,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeAssetPreview}
                            alt={activeAsset?.caption ?? card.title}
                            className="h-full w-full select-none object-contain"
                            draggable={false}
                          />
                        </div>
                      </div>
                      <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full border border-royal/12 bg-white/90 p-1 text-royal shadow-sm">
                        <button
                          type="button"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setImageZoom((currentZoom) =>
                              getNextTemplatePreviewZoom(
                                currentZoom,
                                -TEMPLATE_PREVIEW_ZOOM_STEP,
                              ),
                            );
                          }}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") {
                              return;
                            }

                            event.preventDefault();
                            event.stopPropagation();
                            setImageZoom((currentZoom) =>
                              getNextTemplatePreviewZoom(
                                currentZoom,
                                -TEMPLATE_PREVIEW_ZOOM_STEP,
                              ),
                            );
                          }}
                          disabled={imageZoom <= TEMPLATE_PREVIEW_MIN_ZOOM}
                          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-royal/8 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Zoom portal image out"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </button>
                        <span className="min-w-12 text-center text-xs font-semibold">
                          {Math.round(imageZoom * 100)}%
                        </span>
                        <button
                          type="button"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setImageZoom((currentZoom) =>
                              getNextTemplatePreviewZoom(
                                currentZoom,
                                TEMPLATE_PREVIEW_ZOOM_STEP,
                              ),
                            );
                          }}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") {
                              return;
                            }

                            event.preventDefault();
                            event.stopPropagation();
                            setImageZoom((currentZoom) =>
                              getNextTemplatePreviewZoom(
                                currentZoom,
                                TEMPLATE_PREVIEW_ZOOM_STEP,
                              ),
                            );
                          }}
                          disabled={imageZoom >= TEMPLATE_PREVIEW_MAX_ZOOM}
                          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-royal/8 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Zoom portal image in"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setImageZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
                          }}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") {
                              return;
                            }

                            event.preventDefault();
                            event.stopPropagation();
                            setImageZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-royal/8"
                          aria-label="Reset portal image zoom"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFullscreenAsset(activeAsset);
                          setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
                        }}
                        className="absolute right-16 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-royal/12 bg-white/90 text-royal transition hover:bg-white"
                        aria-label="Open portal image fullscreen"
                      >
                        <Maximize2 className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex h-[280px] w-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.22em] text-royal/48 sm:h-[360px]">
                      Portal preview
                    </div>
                  )}
                </div>

                {galleryAssets.length > 1 ? (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {galleryAssets.map(
                      (asset: SchoolPortalFeatureAssetData) => {
                        const previewSrc = resolveAssetPreview(asset);
                        const isActive = asset.id === activeAsset?.id;

                        return (
                          <button
                            type="button"
                            key={asset.id}
                            onClick={() => setActiveAssetId(asset.id)}
                            className={`relative aspect-[4/3] overflow-hidden rounded-lg border bg-white transition ${
                              isActive
                                ? "border-brand-cyan ring-2 ring-brand-cyan/25"
                                : "border-royal/10 hover:border-brand-cyan/50"
                            }`}
                            aria-label={`Show ${asset.caption ?? card.title}`}
                          >
                            {previewSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewSrc}
                                alt={asset.caption ?? card.title}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                            {asset.mediaType === "VIDEO" ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-royal/45 text-white">
                                <Play className="h-4 w-4" />
                              </div>
                            ) : null}
                          </button>
                        );
                      },
                    )}
                  </div>
                ) : null}
              </div>

              <div className="p-6 sm:p-8">
                <DialogHeader className="text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                    Portal Demo
                  </p>
                  <DialogTitle className="mt-3 dx-heading font-normal text-4xl leading-tight tracking-[-0.04em] text-royal sm:text-5xl">
                    {card.title}
                  </DialogTitle>
                  <DialogDescription className="mt-3 text-sm leading-7 text-surface-muted">
                    {card.summary}
                  </DialogDescription>
                </DialogHeader>

                <p className="mt-6 whitespace-pre-line text-sm leading-7 text-charcoal/80">
                  {card.description}
                </p>

                {card.features.length ? (
                  <div className="mt-6 space-y-3">
                    {card.features.map((feature) => (
                      <div key={feature} className="flex gap-3">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-brand-cyan" />
                        <p className="text-sm leading-6 text-charcoal/80">
                          {feature}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-8">
                  <Link
                    href="#apply"
                    onClick={() => {
                      onOpenChange(false);
                    }}
                  >
                    {/* <Button className="h-11 rounded-full bg-royal px-6 text-sm font-semibold text-white hover:bg-brand">
                      Apply with this portal
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button> */}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {card && fullscreenAsset ? (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-white p-0 backdrop-blur-sm"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setFullscreenAsset(null);
                setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
              }}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                  return;
                }

                event.preventDefault();
                event.stopPropagation();
                setFullscreenAsset(null);
                setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
              }}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-royal/12 bg-white/90 text-royal shadow-sm transition hover:bg-royal hover:text-white"
              aria-label="Close portal fullscreen preview"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-royal/12 bg-white/90 p-1 text-royal shadow-sm backdrop-blur">
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setFullscreenZoom((currentZoom) =>
                    getNextTemplatePreviewZoom(
                      currentZoom,
                      -TEMPLATE_PREVIEW_ZOOM_STEP,
                    ),
                  );
                }}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") {
                    return;
                  }

                  event.preventDefault();
                  event.stopPropagation();
                  setFullscreenZoom((currentZoom) =>
                    getNextTemplatePreviewZoom(
                      currentZoom,
                      -TEMPLATE_PREVIEW_ZOOM_STEP,
                    ),
                  );
                }}
                disabled={fullscreenZoom <= TEMPLATE_PREVIEW_MIN_ZOOM}
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-royal/8 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Zoom portal fullscreen image out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-12 text-center text-xs font-semibold">
                {Math.round(fullscreenZoom * 100)}%
              </span>
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setFullscreenZoom((currentZoom) =>
                    getNextTemplatePreviewZoom(
                      currentZoom,
                      TEMPLATE_PREVIEW_ZOOM_STEP,
                    ),
                  );
                }}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") {
                    return;
                  }

                  event.preventDefault();
                  event.stopPropagation();
                  setFullscreenZoom((currentZoom) =>
                    getNextTemplatePreviewZoom(
                      currentZoom,
                      TEMPLATE_PREVIEW_ZOOM_STEP,
                    ),
                  );
                }}
                disabled={fullscreenZoom >= TEMPLATE_PREVIEW_MAX_ZOOM}
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-royal/8 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Zoom portal fullscreen image in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
                }}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") {
                    return;
                  }

                  event.preventDefault();
                  event.stopPropagation();
                  setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-royal/8"
                aria-label="Reset portal fullscreen image zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <div
              className={`h-screen w-screen overscroll-contain px-3 pb-4 pt-20 sm:px-6 sm:pb-6 ${
                fullscreenZoom > TEMPLATE_PREVIEW_MIN_ZOOM
                  ? "overflow-auto cursor-grab active:cursor-grabbing"
                  : "overflow-hidden cursor-default"
              }`}
              {...fullscreenPanHandlers}
            >
              <div
                className="flex min-h-[calc(100vh-6rem)] min-w-full items-center justify-center transition-[height,width] duration-200"
                style={{
                  height: `calc((100vh - 6rem) * ${fullscreenZoom})`,
                  width: `calc((100vw - 2rem) * ${fullscreenZoom})`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveFullImageSource(fullscreenAsset) ?? ""}
                  alt={`${card.title} fullscreen preview`}
                  className="h-full max-h-full w-full max-w-full select-none object-contain"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
