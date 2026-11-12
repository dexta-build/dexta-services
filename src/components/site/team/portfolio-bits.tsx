"use client";

import { useEffect, useState } from "react";
import {
  Dribbble,
  Facebook,
  Figma,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- social icons ---------------- */

function BehanceIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn("fill-current", className)}
    >
      <path d="M7.8 11.2c.9-.4 1.4-1.1 1.4-2.1C9.2 7 7.7 6 5.6 6H0v12h5.8c2.2 0 4-1.1 4-3.4 0-1.4-.7-2.6-2-3.4zM2.6 8.1h2.5c1 0 1.7.4 1.7 1.3 0 1-.7 1.4-1.6 1.4H2.6V8.1zm2.8 7.8H2.6v-3.2h2.9c1.1 0 1.8.5 1.8 1.6 0 1.1-.8 1.6-1.9 1.6zM15.6 6.7h5.6V8h-5.6V6.7zM24 13.3c0-2.6-1.5-4.8-4.3-4.8-2.7 0-4.5 2-4.5 4.7 0 2.8 1.7 4.7 4.5 4.7 2.1 0 3.5-1 4.2-3h-2.2c-.2.7-1.2 1.1-1.9 1.1-1.4 0-2.1-.8-2.1-2.2H24v-.5zm-6.3-.9c.1-1.1.8-1.8 1.9-1.8 1.2 0 1.8.7 1.9 1.8h-3.8z" />
    </svg>
  );
}

const SOCIALS: Record<
  string,
  { label: string; icon: LucideIcon | typeof BehanceIcon }
> = {
  linkedin: { label: "LinkedIn", icon: Linkedin },
  github: { label: "GitHub", icon: Github },
  instagram: { label: "Instagram", icon: Instagram },
  x: { label: "X (Twitter)", icon: Twitter },
  twitter: { label: "X (Twitter)", icon: Twitter },
  facebook: { label: "Facebook", icon: Facebook },
  youtube: { label: "YouTube", icon: Youtube },
  dribbble: { label: "Dribbble", icon: Dribbble },
  behance: { label: "Behance", icon: BehanceIcon },
  figma: { label: "Figma", icon: Figma },
};

export function socialMeta(platform: string) {
  return (
    SOCIALS[platform] ?? {
      label: platform.charAt(0).toUpperCase() + platform.slice(1),
      icon: Globe,
    }
  );
}

/** Round social icon links. */
export function SocialLinks({
  socials,
  className,
  size = "md",
}: {
  socials: { platform: string; url: string }[];
  className?: string;
  size?: "md" | "lg";
}) {
  if (socials.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {socials.map((s) => {
        const { label, icon: Icon } = socialMeta(s.platform);
        return (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className={cn(
                "border-surface-fg/25 hover:bg-surface-fg hover:text-surface inline-flex items-center justify-center rounded-full border transition-colors",
                size === "lg" ? "size-12" : "size-10",
              )}
            >
              <Icon className={size === "lg" ? "size-5" : "size-4"} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- section nav ---------------- */

/**
 * Sticky in-page menu (About · Expertise · Experience…) that highlights
 * the section on screen, like a personal portfolio site.
 */
export function SectionNav({
  items,
}: {
  items: { id: string; label: string }[];
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="On this page"
      className="bg-canvas/90 border-surface-rule sticky top-14 z-30 border-y backdrop-blur xl:top-[78px]"
    >
      <ul className="dx-no-scrollbar mx-auto flex max-w-[82rem] gap-1 overflow-x-auto px-4 py-2 md:px-8 xl:px-12 3xl:max-w-[94rem]">
        {items.map((i) => (
          <li key={i.id} className="shrink-0">
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? "location" : undefined}
              className={cn(
                "inline-flex rounded-full px-4 py-2 text-sm transition-colors",
                active === i.id
                  ? "bg-royal font-bold text-white"
                  : "text-surface-muted hover:text-surface-fg",
              )}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
