"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

type Props = {
  src: string;
  poster?: string;
  /** Accessible name, e.g. "Brand refresh walkthrough". */
  label?: string;
  autoPlay?: boolean;
  className?: string;
  /** Classes for the <video> itself (e.g. object-contain, height). */
  videoClassName?: string;
  preload?: "auto" | "metadata" | "none";
  onError?: () => void;
};

/**
 * The site's video player: branded controls in every browser, keyboard
 * shortcuts, and no download button or "Save video as" menu. (Nothing can
 * fully stop someone saving a video the browser has to receive, but this
 * removes the easy ways.)
 */
export const VideoPlayer = forwardRef<React.ComponentRef<"video">, Props>(
  function VideoPlayer(
    {
      src,
      poster,
      label = "Video",
      autoPlay = false,
      className,
      videoClassName,
      preload = "metadata",
      onError,
    },
    forwarded,
  ) {
    const wrap = useRef<React.ComponentRef<"div">>(null);
    const video = useRef<React.ComponentRef<"video"> | null>(null);
    const hideTimer = useRef<number | undefined>(undefined);
    const [playing, setPlaying] = useState(false);
    const [ended, setEnded] = useState(false);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [full, setFull] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [started, setStarted] = useState(autoPlay);

    const setRef = (el: React.ComponentRef<"video"> | null) => {
      video.current = el;
      if (typeof forwarded === "function") forwarded(el);
      else if (forwarded) forwarded.current = el;
    };

    const bump = useCallback(() => {
      setShowControls(true);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => {
        if (video.current && !video.current.paused) setShowControls(false);
      }, 2500);
    }, []);

    useEffect(() => () => window.clearTimeout(hideTimer.current), []);

    useEffect(() => {
      const onFs = () => setFull(document.fullscreenElement === wrap.current);
      document.addEventListener("fullscreenchange", onFs);
      return () => document.removeEventListener("fullscreenchange", onFs);
    }, []);

    const toggle = useCallback(() => {
      const v = video.current;
      if (!v) return;
      setStarted(true);
      if (v.paused || v.ended) void v.play().catch(() => {});
      else v.pause();
    }, []);

    const seekBy = (d: number) => {
      const v = video.current;
      if (!v) return;
      v.currentTime = Math.min(Math.max(0, v.currentTime + d), v.duration || 0);
      bump();
    };

    const toggleMute = () => {
      const v = video.current;
      if (!v) return;
      v.muted = !v.muted;
      if (!v.muted && v.volume === 0) v.volume = 0.6;
    };

    const toggleFull = () => {
      const el = wrap.current;
      if (!el) return;
      if (document.fullscreenElement) void document.exitFullscreen();
      else if (el.requestFullscreen) void el.requestFullscreen();
      else {
        // iPhone Safari: only the video element can go full screen.
        const v = video.current as
          | (React.ComponentRef<"video"> & {
              webkitEnterFullscreen?: () => void;
            })
          | null;
        v?.webkitEnterFullscreen?.();
      }
    };

    const onKey = (e: React.KeyboardEvent) => {
      if ((e.target as Element).closest("input")) return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "k") {
        e.preventDefault();
        toggle();
      } else if (k === "arrowright") {
        e.preventDefault();
        seekBy(5);
      } else if (k === "arrowleft") {
        e.preventDefault();
        seekBy(-5);
      } else if (k === "m") toggleMute();
      else if (k === "f") toggleFull();
    };

    const pct = duration ? (time / duration) * 100 : 0;
    const bufPct = duration ? (buffered / duration) * 100 : 0;
    const visible = showControls || !playing;

    return (
      <div
        ref={wrap}
        role="group"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKey}
        onMouseMove={bump}
        onTouchStart={bump}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "group/player relative isolate overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-cyan)]",
          !visible && "cursor-none",
          className,
        )}
      >
        <video
          ref={setRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          playsInline
          preload={preload}
          controlsList="nodownload noremoteplayback noplaybackrate"
          disablePictureInPicture
          disableRemotePlayback
          onClick={toggle}
          onPlay={() => {
            setPlaying(true);
            setEnded(false);
            bump();
          }}
          onPause={() => {
            setPlaying(false);
            setShowControls(true);
          }}
          onEnded={() => {
            setPlaying(false);
            setEnded(true);
            setShowControls(true);
          }}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            setMuted(e.currentTarget.muted);
            setVolume(e.currentTarget.volume);
          }}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onProgress={(e) => {
            const b = e.currentTarget.buffered;
            if (b.length) setBuffered(b.end(b.length - 1));
          }}
          onVolumeChange={(e) => {
            setMuted(e.currentTarget.muted);
            setVolume(e.currentTarget.volume);
          }}
          onError={onError}
          className={cn("block size-full", videoClassName)}
        />

        {/* Big play button before it starts, and when it ends */}
        {(!started || ended) && (
          <button
            type="button"
            onClick={() => {
              if (ended && video.current) video.current.currentTime = 0;
              toggle();
            }}
            aria-label={ended ? "Play again" : "Play video"}
            className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-t from-black/40 to-transparent"
          >
            <span className="bg-royal/85 text-ice flex size-16 items-center justify-center rounded-full backdrop-blur transition-transform duration-300 hover:scale-110 md:size-20">
              {ended ? (
                <RotateCcw aria-hidden className="size-7" />
              ) : (
                <Play
                  aria-hidden
                  className="ml-1 size-7 fill-current md:size-8"
                />
              )}
            </span>
          </button>
        )}

        {/* Control bar */}
        {started && (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-10 pb-3 text-white transition-opacity duration-300 md:px-4",
              visible ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <div className="relative h-1.5 rounded-full bg-white/25">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/35"
                style={{ width: `${bufPct}%` }}
              />
              <div
                className="bg-brand-cyan absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${pct}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={time}
                onChange={(e) => {
                  if (video.current)
                    video.current.currentTime = Number(e.target.value);
                  bump();
                }}
                aria-label="Seek"
                aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
                className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Pause" : "Play"}
                className="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-white/15"
              >
                {playing ? (
                  <Pause aria-hidden className="size-5 fill-current" />
                ) : (
                  <Play aria-hidden className="size-5 fill-current" />
                )}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
                className="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-white/15"
              >
                {muted || volume === 0 ? (
                  <VolumeX aria-hidden className="size-5" />
                ) : (
                  <Volume2 aria-hidden className="size-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = video.current;
                  if (!v) return;
                  v.volume = Number(e.target.value);
                  v.muted = v.volume === 0;
                }}
                aria-label="Volume"
                className="accent-brand-cyan hidden h-1 w-20 cursor-pointer sm:block"
              />
              <span className="ml-2 text-xs font-bold tabular-nums">
                {fmt(time)}{" "}
                <span className="text-white/60">/ {fmt(duration)}</span>
              </span>
              <button
                type="button"
                onClick={toggleFull}
                aria-label={full ? "Exit full screen" : "Full screen"}
                className="ml-auto inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-white/15"
              >
                {full ? (
                  <Minimize aria-hidden className="size-5" />
                ) : (
                  <Maximize aria-hidden className="size-5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);
