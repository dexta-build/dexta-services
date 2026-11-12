import Image from "next/image";
import { cn } from "@/lib/utils";
import type { BrandLogo } from "@/lib/site/brands-data";

/** Turns any logo into one dark tone, like Superside's monochrome logos. */
const MONO = "[filter:grayscale(1)_brightness(0.42)_contrast(1.25)]";
/** Icons: darker with more contrast so light colours (e.g. yellow) stay
 *  visible and inner details (letters, symbols) still read. */
const MONO_ICON = "[filter:grayscale(1)_brightness(0.5)_contrast(1.45)]";

/**
 * Until a client uploads a logo, their name is set as a wordmark. The style
 * is picked from the name, so a row of names reads like a row of logos.
 */
const WORDMARKS = [
  "font-[family-name:var(--font-mont)] text-[1.45em] font-extrabold tracking-[-0.04em]",
  "font-[family-name:var(--font-accent)] text-[1.75em] italic leading-none",
  "font-[family-name:var(--font-mont)] text-[0.95em] font-bold uppercase tracking-[0.22em]",
  "font-[family-name:var(--font-mont)] text-[1.4em] font-black lowercase tracking-[-0.05em]",
  "font-[family-name:var(--font-accent)] text-[1.6em] tracking-[-0.01em] leading-none",
];

function styleFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return WORDMARKS[h % WORDMARKS.length];
}

/**
 * One logo, in a single dark tone. Uploaded logos are shown as they are
 * (made monochrome); products show their icon beside the name; clients
 * without a logo get a wordmark. Sizes are in em, so the parent's font
 * size scales the whole logo (smaller on phones).
 */
export function BrandMark({
  brand,
  className,
}: {
  brand: BrandLogo;
  className?: string;
}) {
  if (brand.logo) {
    return (
      <Image
        src={brand.logo}
        alt={brand.name}
        width={180}
        height={60}
        unoptimized
        className={cn(
          "h-[2em] w-auto max-w-[10em] object-contain",
          MONO,
          className,
        )}
      />
    );
  }

  if (brand.icon) {
    return (
      <span
        className={cn(
          "text-charcoal inline-flex items-center gap-2 font-[family-name:var(--font-mont)] text-[1.3em] font-bold tracking-[-0.03em] whitespace-nowrap",
          className,
        )}
      >
        <Image
          src={brand.icon}
          alt=""
          width={36}
          height={36}
          unoptimized
          className={cn(
            "size-[1.6em] shrink-0 rounded-[0.35em] object-contain",
            MONO_ICON,
          )}
        />
        {brand.name}
      </span>
    );
  }

  // Long names become a two-line lockup: main word on top, the rest in
  // small spaced capitals (e.g. SHEERWOOD / INTERNATIONAL SCHOOL).
  const words = brand.name.trim().split(/\s+/);
  if (words.length >= 3 || brand.name.length > 18) {
    const [main, ...rest] = words;
    return (
      <span
        className={cn(
          "text-charcoal inline-flex flex-col items-center leading-none",
          className,
        )}
      >
        <span className={cn("whitespace-nowrap", styleFor(brand.name))}>
          {main}
        </span>
        <span className="mt-1 font-[family-name:var(--font-mont)] text-[0.5625em] font-bold tracking-[0.24em] whitespace-nowrap uppercase">
          {rest.join(" ")}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "text-charcoal whitespace-nowrap",
        styleFor(brand.name),
        className,
      )}
    >
      {brand.name}
    </span>
  );
}
