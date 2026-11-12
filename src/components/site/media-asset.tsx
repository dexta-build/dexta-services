"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { VideoPlayer } from "./video-player";

export type MediaKind = "image" | "video" | "gif";

export type MediaItem = {
  kind: MediaKind;
  src: string;
  alt?: string;
  /** Poster frame for videos. */
  poster?: string;
  width?: number;
  height?: number;
};

type MediaAssetProps = {
  media: MediaItem;
  /** Fill the parent (the parent must be positioned and sized). */
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Videos autoplay muted while on screen and pause when off screen. */
  autoPlay?: boolean;
  controls?: boolean;
  objectFit?: "cover" | "contain";
  /** Image to show instead if the file can't be loaded. */
  fallbackSrc?: string;
};

/** Renders an image, GIF or video with the right defaults for each. */
export function MediaAsset({
  media,
  fill = true,
  sizes = "100vw",
  priority = false,
  className,
  autoPlay = true,
  controls = false,
  objectFit = "cover",
  fallbackSrc,
}: MediaAssetProps) {
  const videoRef = useRef<React.ComponentRef<"video">>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === media.src;
  const fit = objectFit === "cover" ? "object-cover" : "object-contain";

  // A video can fail before React attaches onError (it starts loading from
  // the server HTML), so also check its state once mounted.
  useEffect(() => {
    const video = videoRef.current;
    if (video && (video.error || video.networkState === 3)) {
      setFailedSrc(media.src);
    }
  }, [media.src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay || controls) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.15 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlay, controls, media.src]);

  // A missing file shows the fallback image, or a quiet block instead of a
  // broken-image icon.
  if (failed && fallbackSrc && fallbackSrc !== media.src) {
    return (
      <MediaAsset
        media={{ kind: "image", src: fallbackSrc, alt: media.alt }}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={className}
        objectFit={objectFit}
      />
    );
  }
  if (failed) {
    return (
      <span
        aria-hidden
        className={cn(
          "from-ocean via-brand to-royal block bg-gradient-to-br",
          fill ? "absolute inset-0" : "aspect-[4/3] w-full",
          className,
        )}
      />
    );
  }

  if (media.kind === "video" && controls) {
    return (
      <VideoPlayer
        ref={videoRef}
        src={media.src}
        poster={media.poster}
        label={media.alt || "Video"}
        preload={priority ? "auto" : "metadata"}
        onError={() => setFailedSrc(media.src)}
        className={cn(
          fill ? "absolute inset-0 h-full w-full" : "w-full",
          className,
        )}
        videoClassName={fit}
      />
    );
  }

  if (media.kind === "video") {
    return (
      <video
        ref={videoRef}
        src={media.src}
        poster={media.poster}
        muted={!controls}
        loop={!controls}
        playsInline
        controls={controls}
        preload={priority ? "auto" : "metadata"}
        aria-label={media.alt}
        onError={() => setFailedSrc(media.src)}
        className={cn(fill && "absolute inset-0 h-full w-full", fit, className)}
      />
    );
  }

  const common = {
    src: media.src,
    alt: media.alt ?? "",
    sizes,
    priority,
    // Next 16 no longer raises fetch priority for priority images.
    fetchPriority: priority ? ("high" as const) : undefined,
    // GIFs skip optimisation (it strips the animation); Cloudinary URLs
    // are already optimised at the source.
    unoptimized:
      media.kind === "gif" ||
      media.src.startsWith("https://res.cloudinary.com/"),
    onError: () => setFailedSrc(media.src),
    className: cn(fit, className),
  };

  return fill ? (
    <Image {...common} alt={common.alt} fill />
  ) : (
    <Image
      {...common}
      alt={common.alt}
      width={media.width ?? 1200}
      height={media.height ?? 900}
    />
  );
}
