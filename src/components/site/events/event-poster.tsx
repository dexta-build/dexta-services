"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Expand, X } from "lucide-react";

/**
 * The event's photo, poster or flyer shown whole (never cropped), with a
 * full-screen view on tap so the small print on a flyer can be read.
 */
export function EventPoster({ src, title }: { src: string; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={`View the ${title} image full size`}
          className="group relative block w-full overflow-hidden rounded-[10px] bg-white/5 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] ring-1 ring-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand-cyan)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- natural size, any aspect */}
          <img
            src={src}
            alt=""
            fetchPriority="high"
            className="mx-auto block max-h-[70vh] w-auto max-w-full object-contain"
          />
          <span className="bg-royal/80 text-ice absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold opacity-90 backdrop-blur transition-opacity group-hover:opacity-100">
            <Expand aria-hidden className="size-3.5" />
            View full size
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[100] bg-[#00042f]/95 backdrop-blur-md" />
        <Dialog.Content
          aria-describedby={undefined}
          className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] fixed inset-0 z-[101] flex items-center justify-center p-4 outline-none md:p-10"
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {/* eslint-disable-next-line @next/next/no-img-element -- natural size, any aspect */}
          <img
            src={src}
            alt={title}
            className="max-h-full max-w-full rounded-[10px] object-contain"
          />
          <Dialog.Close
            aria-label="Close"
            className="text-ice hover:text-royal absolute top-4 right-4 inline-flex size-12 items-center justify-center rounded-full border border-white/40 transition-colors hover:bg-white md:top-6 md:right-6"
          >
            <X aria-hidden className="size-5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
