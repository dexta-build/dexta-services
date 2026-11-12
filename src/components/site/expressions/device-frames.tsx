import Image from "next/image";
import { cn } from "@/lib/utils";

/** A screenshot inside a simple browser window with the site's address. */
export function BrowserFrame({
  src,
  host,
  alt,
  priority,
  sizes = "(min-width: 1024px) 55vw, 100vw",
  className,
}: {
  src: string;
  host: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[12px] bg-white shadow-[0_30px_60px_-30px_rgb(0_4_47/0.55)] ring-1 ring-black/5",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-black/5 bg-[#f3f3f0] px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="text-charcoal/70 mx-auto max-w-[70%] truncate rounded-full bg-white px-4 py-1 text-[0.6875rem]">
          {host}
        </span>
        <span aria-hidden className="w-10" />
      </div>
      <div className="relative aspect-[16/10]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          className="object-cover object-top"
        />
      </div>
    </div>
  );
}

/** A phone-shaped frame for a mobile screenshot. */
export function PhoneFrame({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-charcoal rounded-[26px] p-1.5 shadow-[0_30px_60px_-20px_rgb(0_4_47/0.6)]",
        className,
      )}
    >
      <div className="relative aspect-[9/19] overflow-hidden rounded-[21px] bg-white">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="200px"
          className="object-cover object-top"
        />
      </div>
    </div>
  );
}
