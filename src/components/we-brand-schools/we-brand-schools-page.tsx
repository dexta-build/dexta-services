"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
  Mail,
  Maximize2,
  Phone,
  Play,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  recordSchoolWebsiteTemplateSelection,
  submitSchoolWebsiteApplication,
} from "@/app/(public)/webrandschools/actions";
import { RecaptchaProvider } from "@/components/layout/recaptcha-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import { CONTACT_SOCIAL_PLATFORM_META } from "@/lib/contact-socials";
import type {
  ContactPageContentData,
  ContactSocialLinkData,
} from "@/lib/contact-defaults";
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
  SchoolPortalSectionContentData,
  SchoolWebsiteTestimonialData,
  SchoolWebsiteTemplateAssetData,
  SchoolWebsiteTemplateData,
  WeBrandSchoolsPageContentData,
} from "@/lib/we-brand-schools-defaults";
import { withWeBrandSchoolsPageContentDefaults } from "@/lib/we-brand-schools-defaults";

const WE_BRAND_SCHOOLS_HERO_IMAGE_FALLBACK = "/images/school1.jpg";
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

function resolveImageSource(
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

function WeBrandSchoolsRichText({
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

function resolveTemplateCardPreview(template: SchoolWebsiteTemplateData) {
  const coverAsset =
    template.assets.find((asset) => asset.id === template.coverAssetId) ??
    template.assets[0] ??
    null;

  if (!coverAsset) {
    return null;
  }

  return resolveAssetPreview(coverAsset);
}

function resolvePortalCardPreview(card: SchoolPortalFeatureCardData) {
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

function getSafeYoutubeEmbedUrl(value: string | null) {
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

function SchoolTestimonialCard({
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

  return (
    <article
      className={`grid overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_100%)] text-[#07193f] shadow-[0_24px_64px_-42px_rgba(7,25,63,0.34)] ${
        compact
          ? "h-[214px] w-full max-w-[27rem] grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)]"
          : "h-[238px] w-[min(88vw,27rem)] grid-cols-[minmax(0,0.32fr)_minmax(0,0.68fr)] lg:h-[244px] lg:w-[27.25rem] xl:w-[28rem]"
      }`}
    >
      <div
        className={`flex items-center justify-center border-r border-[#00abff]/55 bg-white ${
          compact ? "p-2" : "p-2.5 md:p-3"
        }`}
      >
        {logoSrc ? (
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
            />
          </div>
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-white font-semibold tracking-[0.18em] text-[#07193f] ${
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
            className={`font-semibold uppercase tracking-[0.24em] text-[#00abff] ${
              compact
                ? "line-clamp-2 text-[9px] leading-[1rem]"
                : "text-[10px] sm:text-[11px]"
            }`}
          >
            {testimonial.schoolName}
          </p>
          <p
            className={`text-[#07193f]/82 ${
              compact
                ? "mt-2 line-clamp-5 text-[0.76rem] leading-[1.08rem]"
                : "mt-2 line-clamp-6 text-[0.86rem] leading-[1.2rem] lg:text-[0.88rem] lg:leading-[1.25rem]"
            }`}
          >
            “{testimonial.quote}”
          </p>
        </div>

        <div
          className={`mt-auto border-t border-[#07193f]/10 ${
            compact ? "pt-3 pb-5" : "pt-4 pb-3"
          }`}
        >
          <p
            className={`font-semibold text-[#07193f] ${
              compact ? "line-clamp-1 text-[0.84rem]" : "line-clamp-1 text-sm"
            }`}
          >
            {testimonial.authorName}
          </p>
          <p
            className={`mt-1 font-semibold uppercase tracking-[0.22em] text-[#07193f]/56 ${
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

function TemplatePreviewDialog({
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
      <DialogContent className="max-h-[92vh] overflow-hidden border-[#07193f]/20 bg-white p-0 text-[#07193f] sm:max-w-6xl">
        {template ? (
          <div className="flex h-full max-h-[92vh] flex-col">
            <div className="border-b border-[#07193f]/10 bg-white px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="font-display text-3xl tracking-[-0.04em] text-[#07193f]">
                  {template.name}
                </DialogTitle>
                <DialogDescription className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
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
                          <p className="px-6 text-center text-sm text-slate-600">
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
                            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#07193f]/12 bg-white/90 text-[#07193f] transition hover:bg-white"
                            aria-label="Previous preview"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => safeSetActiveIndex(activeIndex + 1)}
                            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#07193f]/12 bg-white/90 text-[#07193f] transition hover:bg-white"
                            aria-label="Next preview"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      ) : null}

                      {activeAsset?.mediaType === "IMAGE" ? (
                        <>
                          <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full border border-[#07193f]/12 bg-white/90 p-1 text-[#07193f] shadow-sm">
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
                              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#07193f]/8 disabled:cursor-not-allowed disabled:opacity-40"
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
                              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#07193f]/8 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Zoom image in"
                            >
                              <ZoomIn className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setImageZoom(TEMPLATE_PREVIEW_MIN_ZOOM)
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#07193f]/8"
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
                            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[#07193f]/12 bg-white/90 text-[#07193f] transition hover:bg-white"
                            aria-label="Open fullscreen preview"
                          >
                            <Maximize2 className="h-5 w-5" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {previewAssets.length > 1 ? (
                    <div className="flex gap-3 overflow-x-auto border-t border-[#07193f]/10 px-4 py-4 sm:px-6">
                      {previewAssets.map((asset, index) => {
                        const previewSrc = resolveAssetPreview(asset);
                        return (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={`group relative h-24 w-40 shrink-0 overflow-hidden rounded-2xl border bg-white transition ${
                              index === activeIndex
                                ? "border-[#07193f] ring-2 ring-[#07193f]/10"
                                : "border-[#07193f]/10"
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
                              <div className="flex h-full w-full items-center justify-center bg-white text-slate-500">
                                No media
                              </div>
                            )}
                            {asset.mediaType === "VIDEO" ? (
                              <span className="absolute right-2 top-2 rounded-full bg-[#07193f] p-1 text-white">
                                <Play className="h-3 w-3 fill-current" />
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <aside className="hidden border-l border-[#07193f]/10 bg-white lg:block">
                  <div className="sticky top-0 space-y-6 p-6">
                    <div className="rounded-[26px] border border-[#07193f]/10 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00abff]">
                        Selected template
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#07193f]">
                        {template.name}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {template.description ??
                          "This template is ready for school-specific branding, content, and launch preparation."}
                      </p>

                      <div className="mt-5 flex flex-col gap-3">
                        <Button
                          type="button"
                          onClick={() => onSelectTemplate(template)}
                          className="h-11 rounded-full bg-[#07193f] text-sm font-semibold text-white hover:bg-[#0d2458]"
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
                              className="h-11 w-full rounded-full border-[#07193f]/12 bg-white text-sm font-semibold text-[#07193f] hover:bg-[#07193f] hover:text-white"
                            >
                              Preview Live Site
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          </a>
                        ) : null}
                      </div>
                    </div>

                    {template.highlights.length ? (
                      <div className="rounded-[26px] border border-[#07193f]/10 bg-white p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00abff]">
                          Highlights
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {template.highlights.map((highlight) => (
                            <span
                              key={highlight}
                              className="rounded-full border border-[#07193f]/12 bg-white px-3 py-1 text-xs text-[#07193f]"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[26px] border border-[#07193f]/10 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00abff]">
                        Preview assets
                      </p>
                      <div className="mt-4 grid gap-3 text-sm text-slate-700">
                        <div className="flex items-center justify-between">
                          <span>Total media</span>
                          <span className="font-semibold text-[#07193f]">
                            {template.assets.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Videos</span>
                          <span className="font-semibold text-[#07193f]">
                            {
                              template.assets.filter(
                                (asset) => asset.mediaType === "VIDEO",
                              ).length
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Images</span>
                          <span className="font-semibold text-[#07193f]">
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
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07193f]/96 p-4 sm:p-6">
                <button
                  type="button"
                  onClick={() => {
                    setFullscreenAsset(null);
                    setFullscreenZoom(TEMPLATE_PREVIEW_MIN_ZOOM);
                  }}
                  className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#07193f]"
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

            <div className="border-t border-[#07193f]/10 bg-white px-4 py-3 lg:hidden">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  onClick={() => onSelectTemplate(template)}
                  className="h-10 rounded-full bg-[#07193f] px-5 text-sm font-semibold text-white hover:bg-[#0d2458]"
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
                      className="h-10 w-full rounded-full border-[#07193f]/12 bg-white px-5 text-sm font-semibold text-[#07193f] hover:bg-[#07193f] hover:text-white"
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

function TemplateApplicationDialog({
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
        <DialogContent className="max-h-[92vh] overflow-hidden border-[#07193f]/20 bg-white p-0 text-[#07193f] sm:max-w-3xl">
          {template ? (
            <div className="flex max-h-[92vh] flex-col">
              <div className="border-b border-[#07193f]/10 bg-white px-6 py-5">
                <DialogHeader className="text-left">
                  <DialogTitle className="font-display text-3xl tracking-[-0.04em] text-[#07193f]">
                    Apply for {template.name}
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                {isSuccess ? (
                  <div className="rounded-[28px] border border-emerald-500/20 bg-white p-8 text-center">
                    <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
                    <h3 className="mt-4 font-display text-3xl tracking-[-0.04em] text-[#07193f]">
                      Application received
                    </h3>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-700">
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
                        className="h-11 rounded-full bg-[#07193f] px-6 text-sm font-semibold text-white hover:bg-[#0d2458]"
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
                                className="h-11 rounded-2xl border-[#07193f]/12 bg-white"
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
                                className="min-h-32 rounded-[24px] border-[#07193f]/12 bg-white"
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
                                className="min-h-28 rounded-[24px] border-[#07193f]/12 bg-white"
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
                                className="min-h-28 rounded-[24px] border-[#07193f]/12 bg-white"
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
                                className="min-h-28 rounded-[24px] border-[#07193f]/12 bg-white"
                                {...form.register("coreValues")}
                              />
                              {form.formState.errors.coreValues ? (
                                <p className="mt-2 text-xs text-red-500">
                                  {form.formState.errors.coreValues.message}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="rounded-[28px] border border-[#07193f]/10 bg-white p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00abff]">
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
                                  className="h-11 rounded-2xl border-[#07193f]/12 bg-white"
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
                                  className="h-11 rounded-2xl border-[#07193f]/12 bg-white"
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
                                  className="min-h-24 rounded-[24px] border-[#07193f]/12 bg-white"
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
                                  className="h-11 rounded-2xl border-[#07193f]/12 bg-white"
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
                                  className="h-11 rounded-2xl border-[#07193f]/12 bg-white"
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
                                  className="h-11 rounded-2xl border-[#07193f]/12 bg-white"
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
                                  className="h-11 rounded-2xl border-[#07193f]/12 bg-white"
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
                                  className="h-11 rounded-2xl border-[#07193f]/12 bg-white"
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
                          <div className="rounded-[28px] border border-[#07193f]/10 bg-white p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00abff]">
                              Domain setup
                            </p>
                            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#07193f]">
                              Do you already have a domain name?
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-slate-700">
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
                                className={`rounded-[24px] border px-5 py-5 text-left transition ${
                                  domainChoice === "HAS_DOMAIN"
                                    ? "border-[#07193f] bg-white text-[#07193f]"
                                    : "border-[#07193f]/10 bg-white text-[#07193f]"
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
                                className={`rounded-[24px] border px-5 py-5 text-left transition ${
                                  domainChoice === "NEEDS_DOMAIN"
                                    ? "border-[#07193f] bg-white text-[#07193f]"
                                    : "border-[#07193f]/10 bg-white text-[#07193f]"
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
                                  className="h-11 rounded-2xl border-[#07193f]/12 bg-white"
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
                                    className="h-11 rounded-2xl border-[#07193f]/12 bg-white"
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
                                    className="h-11 rounded-2xl border-[#07193f]/12 bg-white"
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

                            <div className="mt-6 rounded-[24px] border border-[#07193f]/10 bg-[#f8fbff] p-5">
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00abff]">
                                Terms acceptance
                              </p>
                              <p className="mt-3 text-sm leading-7 text-slate-700">
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
                                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#07193f]/12 bg-white px-5 text-sm font-semibold text-[#07193f] transition hover:bg-[#07193f] hover:text-white"
                                >
                                  Read Terms and Conditions
                                </button>

                                <div className="rounded-full bg-white px-4 py-2 text-xs text-slate-600">
                                  {hasViewedTerms
                                    ? "Terms opened"
                                    : "Review available"}
                                </div>
                              </div>

                              <div className="mt-4 flex items-start gap-3 rounded-[20px] border border-[#07193f]/10 bg-white p-4">
                                <Checkbox
                                  id="termsAgreement"
                                  checked={hasAcceptedTerms}
                                  onCheckedChange={(checked) =>
                                    setHasAcceptedTerms(checked === true)
                                  }
                                  className="mt-0.5 border-[#07193f]/30 data-[state=checked]:border-[#07193f] data-[state=checked]:bg-[#07193f]"
                                />
                                <div className="space-y-1">
                                  <Label
                                    htmlFor="termsAgreement"
                                    className="cursor-pointer text-sm font-medium text-[#07193f]"
                                  >
                                    I have read and agree to the Terms and
                                    Conditions
                                  </Label>
                                  <p className="text-xs leading-6 text-slate-600">
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
                <div className="border-t border-[#07193f]/10 bg-white px-6 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#07193f]">
                        Template: {template.name}
                      </p>
                      <p className="text-xs text-slate-600">Step {step} of 2</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      {step === 2 ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="h-11 rounded-full border-[#07193f]/12 bg-white px-6 text-sm font-semibold text-[#07193f] hover:bg-[#07193f] hover:text-white"
                        >
                          Back
                        </Button>
                      ) : null}

                      {step === 1 ? (
                        <Button
                          type="button"
                          onClick={handleStepOneNext}
                          className="h-11 rounded-full bg-[#07193f] px-6 text-sm font-semibold text-white hover:bg-[#0d2458]"
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
                          className="h-11 rounded-full bg-[#07193f] px-6 text-sm font-semibold text-white hover:bg-[#0d2458] disabled:opacity-60"
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
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#07193f]/20 bg-white text-[#07193f] sm:max-w-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-3xl tracking-[-0.04em] text-[#07193f]">
              Terms and Conditions
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-7 text-slate-600">
              These terms apply to the We Brand Schools free website offer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 text-sm leading-7 text-slate-700">
            <div>
              <p className="font-semibold text-[#07193f]">
                1. Free website build
              </p>
              <p>
                Dexta will build a template-based school website for your school
                under this offer at no website development charge.
              </p>
            </div>

            <div>
              <p className="font-semibold text-[#07193f]">
                2. Domain and hosting are paid by the school
              </p>
              <p>
                The school is responsible for paying for its domain name and
                hosting. These are not included for free under this offer.
              </p>
            </div>

            <div>
              <p className="font-semibold text-[#07193f]">
                3. No free domain or hosting obligation
              </p>
              <p>
                Dexta is not responsible for providing free domain registration
                or free hosting for any school. If setup guidance is given, the
                actual third-party costs must still be paid by the school.
              </p>
            </div>

            <div>
              <p className="font-semibold text-[#07193f]">
                4. Template-based delivery only
              </p>
              <p>
                The website will be created from an approved template and
                adapted with your school&apos;s name, content, branding, and
                contact details.
              </p>
            </div>

            <div>
              <p className="font-semibold text-[#07193f]">
                5. Content responsibility
              </p>
              <p>
                Your school is responsible for submitting accurate content,
                approved branding assets, and correct official contact
                information.
              </p>
            </div>

            <div>
              <p className="font-semibold text-[#07193f]">
                6. Review and launch
              </p>
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

function PortalFeaturePreviewDialog({
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
            ? "fixed inset-0 left-0 top-0 z-[100] h-screen max-h-screen w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 bg-white p-0 text-[#07193f] shadow-none sm:max-w-none"
            : "max-h-[92vh] overflow-hidden border-[#07193f]/20 bg-white p-0 text-[#07193f] sm:max-w-6xl"
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
              <div className="bg-[#f5f9ff] p-5 sm:p-6">
                <div className="relative overflow-hidden rounded-lg border border-[#07193f]/10 bg-white">
                  {activeAsset?.mediaType === "VIDEO" ? (
                    <video
                      src={getVideoUrl(activeAsset.publicId)}
                      poster={activeAssetPreview ?? undefined}
                      controls
                      preload="metadata"
                      className="h-[280px] w-full bg-[#07193f] object-contain sm:h-[360px]"
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
                      <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full border border-[#07193f]/12 bg-white/90 p-1 text-[#07193f] shadow-sm">
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
                          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#07193f]/8 disabled:cursor-not-allowed disabled:opacity-40"
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
                          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#07193f]/8 disabled:cursor-not-allowed disabled:opacity-40"
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
                          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#07193f]/8"
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
                        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[#07193f]/12 bg-white/90 text-[#07193f] transition hover:bg-white"
                        aria-label="Open portal image fullscreen"
                      >
                        <Maximize2 className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex h-[280px] w-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#07193f]/48 sm:h-[360px]">
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
                                ? "border-[#00abff] ring-2 ring-[#00abff]/25"
                                : "border-[#07193f]/10 hover:border-[#00abff]/50"
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
                              <div className="absolute inset-0 flex items-center justify-center bg-[#07193f]/45 text-white">
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
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00abff]">
                    Portal Demo
                  </p>
                  <DialogTitle className="mt-3 font-display text-4xl leading-tight tracking-[-0.04em] text-[#07193f] sm:text-5xl">
                    {card.title}
                  </DialogTitle>
                  <DialogDescription className="mt-3 text-sm leading-7 text-slate-600">
                    {card.summary}
                  </DialogDescription>
                </DialogHeader>

                <p className="mt-6 whitespace-pre-line text-sm leading-7 text-slate-700">
                  {card.description}
                </p>

                {card.features.length ? (
                  <div className="mt-6 space-y-3">
                    {card.features.map((feature) => (
                      <div key={feature} className="flex gap-3">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#00abff]" />
                        <p className="text-sm leading-6 text-slate-700">
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
                    {/* <Button className="h-11 rounded-full bg-[#07193f] px-6 text-sm font-semibold text-white hover:bg-[#0d2458]">
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
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[#07193f]/12 bg-white/90 text-[#07193f] shadow-sm transition hover:bg-[#07193f] hover:text-white"
              aria-label="Close portal fullscreen preview"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#07193f]/12 bg-white/90 p-1 text-[#07193f] shadow-sm backdrop-blur">
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
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#07193f]/8 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#07193f]/8 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#07193f]/8"
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

function WeBrandSchoolsPageContent({
  content,
  testimonials,
  templates,
  portalSectionContent,
  portalCards,
  contactContent,
  socialLinks,
}: {
  content: WeBrandSchoolsPageContentData;
  testimonials: SchoolWebsiteTestimonialData[];
  templates: SchoolWebsiteTemplateData[];
  portalSectionContent: SchoolPortalSectionContentData;
  portalCards: SchoolPortalFeatureCardData[];
  contactContent: ContactPageContentData;
  socialLinks: ContactSocialLinkData[];
}) {
  const safeContent = withWeBrandSchoolsPageContentDefaults(content);
  const [previewTemplate, setPreviewTemplate] =
    useState<SchoolWebsiteTemplateData | null>(null);
  const [previewPortalCard, setPreviewPortalCard] =
    useState<SchoolPortalFeatureCardData | null>(null);
  const [isPortalSectionVideoOpen, setIsPortalSectionVideoOpen] =
    useState(false);
  const [applicationTemplate, setApplicationTemplate] =
    useState<SchoolWebsiteTemplateData | null>(null);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const desktopTestimonialsRef = useRef<HTMLDivElement | null>(null);
  const desktopAnimationFrameRef = useRef<number | null>(null);
  const desktopManualPauseUntilRef = useRef(0);
  const desktopHoverPausedRef = useRef(false);
  const [templateBatchSize, setTemplateBatchSize] = useState(2);
  const [visibleTemplateCount, setVisibleTemplateCount] = useState(2);
  const primaryEmail = contactContent.emails[0] ?? "info@dexta.services";
  const primaryPhone = contactContent.phones[0] ?? "+234 810 320 8287";
  const whatsappHref =
    socialLinks.find((social) => social.platform === "WHATSAPP")?.href ??
    "/contact";
  const heroImageSrc = safeContent.heroImagePublicId
    ? resolveImageSource(safeContent.heroImagePublicId, {
        c: "fill",
        g: "auto",
        h: 1400,
        q: "auto",
        w: 1200,
      })
    : WE_BRAND_SCHOOLS_HERO_IMAGE_FALLBACK;

  const openTemplatePreview = useCallback(
    (template: SchoolWebsiteTemplateData) => {
      setPreviewTemplate(template);
    },
    [],
  );

  const selectTemplate = useCallback((template: SchoolWebsiteTemplateData) => {
    setPreviewTemplate(null);
    setApplicationTemplate(template);
    void recordSchoolWebsiteTemplateSelection(template.slug);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const syncTemplateBatchSize = (matches: boolean) => {
      const nextBatchSize = matches ? 3 : 2;
      setTemplateBatchSize(nextBatchSize);
      setVisibleTemplateCount((current) =>
        templates.length
          ? Math.min(templates.length, Math.max(nextBatchSize, current))
          : 0,
      );
    };

    syncTemplateBatchSize(mediaQuery.matches);

    const handleChange = () => {
      syncTemplateBatchSize(mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [templates.length]);

  useEffect(() => {
    setVisibleTemplateCount((current) =>
      templates.length
        ? Math.min(templates.length, Math.max(templateBatchSize, current))
        : 0,
    );
  }, [templateBatchSize, templates.length]);

  const visibleTemplates = useMemo(
    () => templates.slice(0, visibleTemplateCount),
    [templates, visibleTemplateCount],
  );
  const visiblePortalCards = useMemo(
    () => portalCards.filter((card) => card.isVisible).slice(0, 6),
    [portalCards],
  );
  const hasMoreTemplates = visibleTemplateCount < templates.length;
  const shouldShowPortalSection =
    portalSectionContent.isVisible && visiblePortalCards.length > 0;
  const portalSectionCtaHref = portalSectionContent.ctaHref?.trim() ?? "";
  const hasPortalSectionCtaLink =
    portalSectionCtaHref.length > 0 &&
    portalSectionCtaHref !== "#" &&
    portalSectionCtaHref !== "#school-portal";
  const portalSectionYoutubeEmbedUrl = getSafeYoutubeEmbedUrl(
    hasPortalSectionCtaLink ? portalSectionCtaHref : null,
  );
  const firstTestimonial = testimonials[0] ?? null;
  const activeMobileTestimonial =
    testimonials[activeTestimonialIndex] ?? firstTestimonial;
  const hasMultipleTestimonials = testimonials.length > 1;

  const cycleTestimonial = useCallback(
    (direction: -1 | 1) => {
      if (!testimonials.length) return;

      setActiveTestimonialIndex((current) => {
        const nextIndex = current + direction;

        if (nextIndex < 0) {
          return testimonials.length - 1;
        }

        if (nextIndex >= testimonials.length) {
          return 0;
        }

        return nextIndex;
      });
    },
    [testimonials.length],
  );

  useEffect(() => {
    setActiveTestimonialIndex((current) => {
      if (!testimonials.length) return 0;
      return Math.min(current, testimonials.length - 1);
    });
  }, [testimonials.length]);

  useEffect(() => {
    if (!hasMultipleTestimonials) return;

    const intervalId = window.setInterval(() => {
      cycleTestimonial(1);
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [cycleTestimonial, hasMultipleTestimonials]);

  const normalizeDesktopTestimonialsPosition = useCallback(() => {
    const container = desktopTestimonialsRef.current;
    const firstSet = container?.querySelector<HTMLElement>(
      "[data-testimonial-set]",
    );
    const setWidth = firstSet?.offsetWidth ?? 0;

    if (!container || !setWidth) return;

    if (container.scrollLeft < setWidth * 0.5) {
      container.scrollLeft += setWidth;
      return;
    }

    if (container.scrollLeft > setWidth * 1.5) {
      container.scrollLeft -= setWidth;
    }
  }, []);

  const scrollDesktopTestimonials = useCallback((direction: -1 | 1) => {
    const container = desktopTestimonialsRef.current;
    if (!container) return;

    const firstSet = container.querySelector<HTMLElement>(
      "[data-testimonial-set]",
    );
    const firstCard = container.querySelector<HTMLElement>(
      "[data-testimonial-card]",
    );
    const cardWidth = firstCard?.offsetWidth ?? 0;
    const gapWidth = Number.parseFloat(
      window.getComputedStyle(firstSet ?? container).columnGap || "24",
    );
    const stepSize = cardWidth + gapWidth;
    const currentScrollLeft = container.scrollLeft;

    desktopManualPauseUntilRef.current = Date.now() + 700;

    container.scrollTo({
      behavior: "smooth",
      left: currentScrollLeft + stepSize * direction,
    });
  }, []);

  useEffect(() => {
    if (!hasMultipleTestimonials) return;

    const initializePosition = () => {
      const container = desktopTestimonialsRef.current;
      const firstSet = container?.querySelector<HTMLElement>(
        "[data-testimonial-set]",
      );
      const setWidth = firstSet?.offsetWidth ?? 0;

      if (!container || !setWidth) return;

      container.scrollLeft = setWidth;
    };

    const animationStep = () => {
      const container = desktopTestimonialsRef.current;
      if (
        container &&
        window.matchMedia("(min-width: 768px)").matches &&
        !desktopHoverPausedRef.current &&
        Date.now() >= desktopManualPauseUntilRef.current
      ) {
        container.scrollLeft += 0.75;
        normalizeDesktopTestimonialsPosition();
      }

      desktopAnimationFrameRef.current =
        window.requestAnimationFrame(animationStep);
    };

    const initFrame = window.requestAnimationFrame(() => {
      initializePosition();
      desktopAnimationFrameRef.current =
        window.requestAnimationFrame(animationStep);
    });

    return () => {
      window.cancelAnimationFrame(initFrame);
      if (desktopAnimationFrameRef.current) {
        window.cancelAnimationFrame(desktopAnimationFrameRef.current);
      }
    };
  }, [hasMultipleTestimonials, normalizeDesktopTestimonialsPosition]);

  return (
    <>
      <main className="flex flex-col bg-[linear-gradient(180deg,#f8f5ec_0%,#ffffff_20%,#f4f8ff_100%)] text-slate-950">
        <section className="order-1 relative overflow-hidden bg-[var(--dexta-secondary)] text-white">
          <div className="absolute inset-0 lg:hidden" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImageSrc}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: "var(--dexta-secondary)",
                opacity: 0.84,
              }}
            />
          </div>
          <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="flex items-center"
            >
              {safeContent.logoPublicId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getCloudinaryUrl(safeContent.logoPublicId, {
                    h: 96,
                    q: "auto",
                  })}
                  alt="We Brand Schools"
                  className="h-12 w-auto object-contain sm:h-14"
                />
              ) : (
                <WeBrandSchoolsRichText
                  as="p"
                  mode="inline"
                  value={safeContent.heroEyebrow}
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-white"
                />
              )}
            </motion.div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.1, ease: "easeOut" }}
                className="max-w-4xl"
              >
                <WeBrandSchoolsRichText
                  as="h1"
                  mode="inline"
                  value={safeContent.heroHeadline}
                  className="mt-4 max-w-5xl font-display text-[clamp(3rem,7vw,6.4rem)] leading-[0.9] tracking-[-0.05em]"
                />
                <WeBrandSchoolsRichText
                  as="div"
                  mode="block"
                  value={safeContent.heroBody}
                  className="mt-6 max-w-2xl text-base leading-8 text-white/82 sm:text-lg [&_p]:mb-3 [&_p:last-child]:mb-0"
                />

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href={safeContent.heroPrimaryCtaHref}>
                    <Button className="h-12 rounded-full bg-white px-7 text-sm font-semibold text-[#07193f] transition-opacity hover:opacity-90">
                      {safeContent.heroPrimaryCtaText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={safeContent.heroSecondaryCtaHref}>
                    <Button
                      variant="outline"
                      className="h-12 rounded-full border-white/40 bg-transparent px-7 text-sm font-semibold text-white hover:bg-white hover:text-[#07193f]"
                    >
                      {safeContent.heroSecondaryCtaText}
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 34, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                className="hidden lg:block"
              >
                <div className="overflow-hidden rounded-[30px] border border-white/14 shadow-[0_28px_90px_-42px_rgba(7,25,63,0.7)]">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroImageSrc}
                      alt="We Brand Schools hero"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28, ease: "easeOut" }}
              className="mt-12 grid gap-4 md:grid-cols-3"
            >
              {[
                safeContent.heroFeature1,
                safeContent.heroFeature2,
                safeContent.heroFeature3,
              ]
                .filter((item) => item.trim().length > 0)
                .map((item, index) => (
                  <div
                    key={`hero-feature-${index}-${item}`}
                    className="rounded-[26px] border border-white/12 bg-white/8 px-5 py-5 backdrop-blur-sm"
                  >
                    <WeBrandSchoolsRichText
                      as="p"
                      mode="inline"
                      value={item}
                      className="text-sm font-medium text-white/88"
                    />
                  </div>
                ))}
            </motion.div>
          </div>
        </section>

        <section className="order-2 mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-start">
            <div>
              <WeBrandSchoolsRichText
                as="p"
                mode="inline"
                value={safeContent.overviewLabel}
                className="text-xs font-semibold uppercase tracking-[0.26em] text-[#00abff]"
              />
              <WeBrandSchoolsRichText
                as="h2"
                mode="inline"
                value={safeContent.overviewTitle}
                className="mt-4 max-w-3xl font-display text-4xl leading-tight tracking-[-0.04em] text-[#07193f] sm:text-5xl"
              />
              <WeBrandSchoolsRichText
                as="div"
                mode="block"
                value={safeContent.overviewBody}
                className="mt-5 max-w-2xl text-base leading-8 text-slate-700 [&_p]:mb-3 [&_p:last-child]:mb-0"
              />

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={safeContent.overviewPrimaryCtaHref}>
                  <Button className="h-12 rounded-full bg-[#07193f] px-7 text-sm font-semibold text-white hover:bg-[#0d2458]">
                    {safeContent.overviewPrimaryCtaText}
                  </Button>
                </Link>
                <Link href={safeContent.overviewSecondaryCtaHref}>
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-[#07193f]/20 bg-white px-7 text-sm font-semibold text-[#07193f] hover:bg-[#07193f] hover:text-white"
                  >
                    {safeContent.overviewSecondaryCtaText}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-[32px] border border-[#07193f]/10 bg-white p-7">
              <WeBrandSchoolsRichText
                as="p"
                mode="inline"
                value={safeContent.overviewBenefitsLabel}
                className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00abff]"
              />
              <div className="mt-5 space-y-4">
                {[
                  safeContent.overviewBenefit1,
                  safeContent.overviewBenefit2,
                  safeContent.overviewBenefit3,
                  safeContent.overviewBenefit4,
                ]
                  .filter((item) => item.trim().length > 0)
                  .map((item, index) => (
                    <div
                      key={`overview-benefit-${index}-${item}`}
                      className="flex gap-3"
                    >
                      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#00abff]" />
                      <WeBrandSchoolsRichText
                        as="p"
                        mode="inline"
                        value={item}
                        className="text-sm leading-7 text-slate-700"
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {shouldShowPortalSection ? (
          <section
            id="school-portal"
            className="order-4 py-20 text-white lg:py-24"
            style={
              {
                backgroundColor: "var(--dexta-secondary)",
                "--about-brand": "var(--dexta-primary)",
                "--about-brand-deep": "var(--dexta-secondary)",
                "--about-accent": "var(--dexta)",
                "--about-border": "var(--dexta-primary)",
              } as CSSProperties
            }
          >
            <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--about-accent)]">
                    {portalSectionContent.eyebrow}
                  </p>
                  <h2 className="mt-4 font-display text-4xl leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                    {portalSectionContent.title}
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">
                    {portalSectionContent.description}
                  </p>
                </div>

                {portalSectionContent.ctaText && hasPortalSectionCtaLink ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (portalSectionYoutubeEmbedUrl) {
                        setIsPortalSectionVideoOpen(true);
                        return;
                      }

                      window.location.href = portalSectionCtaHref;
                    }}
                    className="h-12 rounded-full border-[#07193f]/20 bg-white px-7 text-sm font-semibold text-[#07193f] hover:bg-[#07193f] hover:text-white"
                  >
                    {portalSectionContent.ctaText}
                    {portalSectionYoutubeEmbedUrl ? (
                      <Play className="ml-2 h-4 w-4 fill-current" />
                    ) : null}
                  </Button>
                ) : null}
              </div>

              <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {visiblePortalCards.map((card) => {
                  const previewSrc = resolvePortalCardPreview(card);

                  return (
                    <article
                      key={card.id}
                      className="group flex min-h-[390px] flex-col overflow-hidden rounded-lg border border-[var(--about-border)]/12 bg-white shadow-[0_22px_64px_-48px_rgba(7,25,63,0.35)] transition duration-300 hover:-translate-y-1 hover:border-[var(--about-accent)]/40"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewPortalCard(card)}
                        className="block w-full text-left"
                      >
                        <div className="relative h-52 overflow-hidden bg-white">
                          {previewSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={previewSrc}
                              alt={card.title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#07193f]/45">
                              Portal feature
                            </div>
                          )}
                        </div>
                      </button>

                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#07193f]">
                          {card.title}
                        </h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-700">
                          {card.summary}
                        </p>

                        <div className="mt-auto pt-5">
                          <Button
                            type="button"
                            onClick={() => setPreviewPortalCard(card)}
                            className="h-10 rounded-full bg-[#07193f] px-5 text-sm font-semibold text-white hover:bg-[#0d2458]"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* Testimonials */}
        <section
          className="order-3 bg-[color-mix(in_srgb,var(--about-accent)_9%,white)] py-20 lg:py-24"
          style={
            {
              "--about-brand": "var(--dexta-primary)",
              "--about-brand-deep": "var(--dexta-secondary)",
              "--about-accent": "var(--dexta)",
              "--about-border": "var(--dexta-primary)",
            } as CSSProperties
          }
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--about-accent)]">
                Testimonials
              </p>
              <h2 className="mt-4 font-display text-4xl leading-tight tracking-[-0.04em] text-[var(--about-brand-deep)] sm:text-5xl">
                Trusted by schools across Nigeria
              </h2>
              {/* <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--about-brand-deep)]/80">
                Real feedback from school leaders using Dexta’s template-led
                website rollout to sharpen how their institutions show up
                online.
              </p> */}
            </div>

            {testimonials.length ? (
              <div className="mt-10">
                <div className="mx-auto max-w-sm md:hidden">
                  {activeMobileTestimonial ? (
                    <>
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--about-accent)]">
                            Featured school
                          </p>
                        </div>

                        {testimonials.length > 1 ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => cycleTestimonial(-1)}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#00abff]/22 bg-white text-[#07193f] shadow-[0_18px_40px_-28px_rgba(7,25,63,0.35)] transition hover:-translate-y-0.5 hover:border-[#00abff]/40 hover:text-[#00abff]"
                              aria-label="View previous school testimonial"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => cycleTestimonial(1)}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#00abff]/22 bg-white text-[#07193f] shadow-[0_18px_40px_-28px_rgba(7,25,63,0.35)] transition hover:-translate-y-0.5 hover:border-[#00abff]/40 hover:text-[#00abff]"
                              aria-label="View next school testimonial"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={activeMobileTestimonial.id}
                          initial={{ opacity: 0, x: 18, scale: 0.98 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -18, scale: 0.98 }}
                          transition={{ duration: 0.28, ease: "easeOut" }}
                        >
                          <SchoolTestimonialCard
                            testimonial={activeMobileTestimonial}
                            compact
                          />
                        </motion.div>
                      </AnimatePresence>
                    </>
                  ) : null}
                </div>

                <div className="relative hidden md:block">
                  <div className="mb-5 flex items-center justify-end gap-2">
                    {testimonials.length > 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => scrollDesktopTestimonials(-1)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#00abff]/22 bg-white text-[#07193f] shadow-[0_18px_40px_-28px_rgba(7,25,63,0.35)] transition hover:-translate-y-0.5 hover:border-[#00abff]/40 hover:text-[#00abff]"
                          aria-label="Scroll to previous school testimonials"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollDesktopTestimonials(1)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#00abff]/22 bg-white text-[#07193f] shadow-[0_18px_40px_-28px_rgba(7,25,63,0.35)] transition hover:-translate-y-0.5 hover:border-[#00abff]/40 hover:text-[#00abff]"
                          aria-label="Scroll to next school testimonials"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    ) : null}
                  </div>

                  <div className="pointer-events-none absolute inset-y-[3.5rem] left-0 z-10 w-8 bg-gradient-to-r from-[color-mix(in_srgb,var(--about-accent)_9%,white)] to-transparent lg:w-12" />
                  <div className="pointer-events-none absolute inset-y-[3.5rem] right-0 z-10 w-8 bg-gradient-to-l from-[color-mix(in_srgb,var(--about-accent)_9%,white)] to-transparent lg:w-12" />

                  <div
                    ref={desktopTestimonialsRef}
                    className="hero-card-scroller overflow-x-auto py-1"
                    onMouseEnter={() => {
                      desktopHoverPausedRef.current = true;
                    }}
                    onMouseLeave={() => {
                      desktopHoverPausedRef.current = false;
                    }}
                    onScroll={() => normalizeDesktopTestimonialsPosition()}
                  >
                    {testimonials.length > 1 ? (
                      <div className="flex w-max">
                        {[0, 1, 2].map((copyIndex) => (
                          <div
                            key={`testimonial-set-${copyIndex}`}
                            data-testimonial-set
                            className="flex shrink-0 gap-5 pr-5 lg:gap-6 lg:pr-6"
                            aria-hidden={copyIndex !== 1}
                          >
                            {testimonials.map((testimonial) => (
                              <div
                                key={`${testimonial.id}-${copyIndex}`}
                                data-testimonial-card
                              >
                                <SchoolTestimonialCard
                                  testimonial={testimonial}
                                />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        {firstTestimonial ? (
                          <SchoolTestimonialCard
                            testimonial={firstTestimonial}
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-10 rounded-[30px] border border-[var(--about-border)]/12 bg-white px-6 py-10 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--about-accent)]">
                  Testimonials will appear here
                </p>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--about-brand-deep)]/76">
                  Add school cards from the admin testimonials screen to start
                  the right-to-left carousel on this page.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* How it works section */}
        <section
          id="apply"
          className="order-5 w-full bg-[color-mix(in_srgb,var(--about-accent)_9%,white)] py-20 lg:py-24"
          style={
            {
              "--about-brand": "var(--dexta-primary)",
              "--about-brand-deep": "var(--dexta-secondary)",
              "--about-accent": "var(--dexta)",
              "--about-border": "var(--dexta-primary)",
            } as CSSProperties
          }
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <WeBrandSchoolsRichText
                  as="p"
                  mode="inline"
                  value={content.processLabel}
                  className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--about-accent)]"
                />
                <WeBrandSchoolsRichText
                  as="h2"
                  mode="inline"
                  value={content.processTitle}
                  className="mt-4 font-display text-4xl leading-tight tracking-[-0.04em] text-[var(--about-brand-deep)] sm:text-5xl"
                />
              </div>

              <Link href="#templates">
                <Button className="h-12 rounded-full bg-[#07193f] px-7 text-sm font-semibold text-white hover:bg-[#0d2458]">
                  Start Here
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  step: "01",
                  title: content.processStep1Title,
                  body: content.processStep1Body,
                },
                {
                  step: "02",
                  title: content.processStep2Title,
                  body: content.processStep2Body,
                },
                {
                  step: "03",
                  title: content.processStep3Title,
                  body: content.processStep3Body,
                },
                {
                  step: "04",
                  title: content.processStep4Title,
                  body: content.processStep4Body,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-[28px] border border-[var(--about-border)]/12 bg-white p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--about-accent)]">
                    Step {item.step}
                  </p>
                  <WeBrandSchoolsRichText
                    as="h3"
                    mode="inline"
                    value={item.title}
                    className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[var(--about-brand-deep)]"
                  />
                  <WeBrandSchoolsRichText
                    as="div"
                    mode="block"
                    value={item.body}
                    className="mt-3 text-sm leading-7 text-[var(--about-brand-deep)]/76 [&_p]:mb-2 [&_p:last-child]:mb-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Templates */}
        <section
          id="templates"
          className="order-6 py-20 text-white lg:py-24"
          style={{ backgroundColor: "var(--dexta-secondary)" }}
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <WeBrandSchoolsRichText
                  as="p"
                  mode="inline"
                  value={content.templatesLabel}
                  className="text-xs font-semibold uppercase tracking-[0.26em] text-white"
                />
                <WeBrandSchoolsRichText
                  as="h2"
                  mode="inline"
                  value={content.templatesTitle}
                  className="mt-4 font-display text-4xl leading-tight tracking-[-0.04em] sm:text-5xl"
                />
                <WeBrandSchoolsRichText
                  as="div"
                  mode="block"
                  value={content.templatesBody}
                  className="mt-5 text-base leading-8 text-white/78 [&_p]:mb-3 [&_p:last-child]:mb-0"
                />
              </div>

              <Link href="https://wa.me/2348103208297" target="blank">
                <Button className="h-12 rounded-full bg-white px-7 text-sm font-semibold text-[#07193f] hover:opacity-90">
                  Need help choosing?
                </Button>
              </Link>
            </div>

            {templates.length ? (
              <div className="mt-10">
                <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleTemplates.map((template) => {
                    const previewSrc = resolveTemplateCardPreview(template);

                    return (
                      <article
                        key={template.id}
                        className="group mx-auto flex w-full max-w-[390px] flex-col overflow-hidden rounded-[30px] border border-white/15 bg-white/8 backdrop-blur-sm transition duration-300 hover:bg-white/10"
                      >
                        <button
                          type="button"
                          onClick={() => openTemplatePreview(template)}
                          className="block w-full text-left"
                        >
                          <div className="relative h-[430px] overflow-hidden bg-white sm:h-[470px] lg:h-[520px]">
                            {previewSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewSrc}
                                alt={template.name}
                                className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(0,171,255,0.22),rgba(255,255,255,0.08))] text-[11px] font-medium uppercase tracking-[0.18em] text-white/75">
                                No media
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07193f]/92 via-[#07193f]/40 to-transparent px-5 py-5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/68">
                                Website Template
                              </p>
                              <h3 className="mt-2 font-display text-[30px] leading-none tracking-[-0.04em] text-white">
                                {template.name}
                              </h3>
                            </div>
                          </div>
                        </button>

                        <div className="flex flex-1 flex-col px-5 py-5">
                          <div className="mt-auto flex flex-wrap justify-center gap-3">
                            <Button
                              type="button"
                              onClick={() => openTemplatePreview(template)}
                              className="h-10 rounded-full bg-white px-5 text-sm font-semibold text-[#07193f] hover:opacity-90"
                            >
                              View
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setApplicationTemplate(template)}
                              className="h-10 rounded-full border-white/20 bg-transparent px-5 text-sm font-semibold text-white hover:bg-white hover:text-[#07193f]"
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {hasMoreTemplates ? (
                  <div className="mt-10 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setVisibleTemplateCount((current) =>
                          Math.min(
                            templates.length,
                            current + templateBatchSize,
                          ),
                        );
                      }}
                      className="h-11 rounded-full border-white/20 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white hover:text-[#07193f]"
                    >
                      View more
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-10 rounded-[32px] border border-dashed border-white/20 bg-white/4 px-6 py-10 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white">
                  Templates will appear here
                </p>
                <h3 className="mt-4 font-display text-3xl tracking-[-0.04em] text-white">
                  The landing page structure is ready for your school website
                  catalog.
                </h3>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/75">
                  Once templates are added from the admin side, this section
                  will display each website with its media preview, live preview
                  link, and selection CTA.
                </p>
                <div className="mt-6 flex justify-center">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <Button className="h-11 rounded-full bg-white px-6 text-sm font-semibold text-[#07193f] hover:opacity-90">
                      Contact Us
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Help Section */}
        <section
          id="help"
          className="order-7 w-full bg-white py-20 text-[#07193f] lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#00abff]">
                  Need help?
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <Button className="h-12 rounded-full bg-[#00abff] px-7 text-sm font-semibold text-white shadow-[0_18px_42px_-24px_rgba(0,171,255,0.9)] hover:bg-[#24baff]">
                      Contact Us
                    </Button>
                  </a>
                  <Link href="#templates">
                    <Button
                      variant="outline"
                      className="h-12 rounded-full border-[#07193f]/20 bg-white px-7 text-sm font-semibold text-[#07193f] hover:bg-[#07193f] hover:text-white"
                    >
                      Back to templates
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-[32px] border border-[#07193f]/10 bg-[#f8fbff] p-7">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 rounded-[24px] border border-[#07193f]/10 bg-white p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#00abff]/20 bg-[#00abff]/10 text-[#00abff]">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00abff]">
                        {contactContent.emailLabel}
                      </p>
                      <a
                        href={`mailto:${primaryEmail}`}
                        className="mt-2 block text-sm leading-7 text-[#07193f] underline-offset-2 hover:underline"
                      >
                        {primaryEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-[24px] border border-[#07193f]/10 bg-white p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#00abff]/20 bg-[#00abff]/10 text-[#00abff]">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00abff]">
                        {contactContent.phoneLabel}
                      </p>
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm leading-7 text-[#07193f] underline-offset-2 hover:underline"
                      >
                        {primaryPhone}
                      </a>
                    </div>
                  </div>
                </div>

                {socialLinks.length ? (
                  <div className="mt-6 border-t border-[#07193f]/10 pt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00abff]">
                      {contactContent.socialsLabel}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {socialLinks.map((social) => {
                        const Icon =
                          CONTACT_SOCIAL_PLATFORM_META[social.platform].icon;

                        return (
                          <a
                            key={`${social.platform}-${social.href}`}
                            href={social.href}
                            title={social.label}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#07193f]/10 bg-white text-[#07193f] transition-colors hover:bg-[#00abff] hover:text-white"
                          >
                            <Icon className="h-4 w-4" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Dialog
        open={isPortalSectionVideoOpen}
        onOpenChange={setIsPortalSectionVideoOpen}
      >
        <DialogContent className="max-h-[92vh] overflow-hidden border-[#07193f]/20 bg-white p-0 text-[#07193f] sm:max-w-5xl">
          <div className="border-b border-[#07193f]/10 px-6 py-5">
            <DialogHeader className="text-left">
              <DialogTitle className="font-display text-3xl tracking-[-0.04em] text-[#07193f]">
                {portalSectionContent.ctaText ?? "Portal video"}
              </DialogTitle>
              <DialogDescription className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                {portalSectionContent.title}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="bg-[#f8fbff] p-4 sm:p-6">
            <div className="aspect-video overflow-hidden rounded-lg border border-[#07193f]/10 bg-[#07193f]">
              {isPortalSectionVideoOpen && portalSectionYoutubeEmbedUrl ? (
                <iframe
                  src={`${portalSectionYoutubeEmbedUrl}?autoplay=1&rel=0`}
                  title={`${portalSectionContent.title} video`}
                  className="h-full w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PortalFeaturePreviewDialog
        card={previewPortalCard}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewPortalCard(null);
          }
        }}
      />

      <TemplatePreviewDialog
        template={previewTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewTemplate(null);
          }
        }}
        onSelectTemplate={selectTemplate}
      />

      <TemplateApplicationDialog
        template={applicationTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setApplicationTemplate(null);
          }
        }}
      />
    </>
  );
}

export function WeBrandSchoolsPage(props: {
  content: WeBrandSchoolsPageContentData;
  testimonials: SchoolWebsiteTestimonialData[];
  templates: SchoolWebsiteTemplateData[];
  portalSectionContent: SchoolPortalSectionContentData;
  portalCards: SchoolPortalFeatureCardData[];
  contactContent: ContactPageContentData;
  socialLinks: ContactSocialLinkData[];
}) {
  return (
    <RecaptchaProvider>
      <WeBrandSchoolsPageContent {...props} />
      <Toaster />
    </RecaptchaProvider>
  );
}
