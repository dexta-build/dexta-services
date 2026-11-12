import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ResourceHighlight,
  type ServiceGroup,
} from "@/lib/site/navigation";
import { NavIcon } from "./nav-icon";
import { asIcon, pillFor, useSiteNav } from "./nav-context";

/** Coloured pill heading with an arrow, as in Superside's mega-menu. */
export function GroupPill({
  group,
  onNavigate,
  className,
}: {
  group: Pick<ServiceGroup, "title" | "href"> & { pillClass?: string };
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={group.href}
      onClick={onNavigate}
      className={cn(
        "group/pill inline-flex items-center gap-2 rounded-[10px] px-4 py-2 font-[family-name:var(--font-accent)] text-2xl leading-none transition-transform duration-300 ease-(--ease-out-expo) hover:-translate-y-0.5",
        group.pillClass,
        className,
      )}
    >
      {group.title}
      <ArrowUpRight
        aria-hidden
        className="size-4 transition-transform duration-300 group-hover/pill:translate-x-0.5 group-hover/pill:-translate-y-0.5"
      />
    </Link>
  );
}

/** One row: title + description on the left, line icon on the right. */
export function MenuRow({
  href,
  title,
  description,
  icon,
  onNavigate,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group/row border-surface-rule flex items-center justify-between gap-4 border-b py-3.5 last:border-b-0"
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-[0.9375rem] transition-colors group-hover/row:text-brand">
          {title}
        </span>
        <span className="text-surface-muted text-sm">{description}</span>
      </span>
      <NavIcon
        name={asIcon(icon)}
        className="text-surface-muted size-5 shrink-0 transition-colors group-hover/row:text-brand"
      />
    </Link>
  );
}

export function ServicesPanel({ onNavigate }: { onNavigate: () => void }) {
  const nav = useSiteNav();
  return (
    <div className="grid grid-cols-3 gap-8 3xl:gap-12">
      {nav.serviceGroups.map((group, gi) => (
        <div key={group.key ?? group.href} className="flex flex-col gap-4">
          <GroupPill
            group={{ ...group, pillClass: pillFor(group, gi) }}
            onNavigate={onNavigate}
            className="self-start"
          />
          <div className="flex flex-col">
            {group.items.map((item) => (
              <MenuRow key={item.href} {...item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CataloguesPanel({ onNavigate }: { onNavigate: () => void }) {
  const nav = useSiteNav();
  const catalogues = nav.catalogues;
  const picked = catalogues.filter((c) => c.featured);
  const featured = (picked.length ? picked : catalogues).slice(0, 2);
  return (
    <div className="grid grid-cols-[1fr_2fr] gap-10">
      <div className="border-surface-rule flex flex-col border-r pr-10">
        <p className="mb-2 text-[0.9375rem]">
          {nav.labels.cataloguesList ?? "Our catalogues"}
        </p>
        {catalogues.map((c) => (
          <MenuRow
            key={c.slug}
            href={c.href}
            title={c.title}
            description={c.description}
            icon={asIcon(c.icon)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[0.9375rem]">
            {nav.labels.cataloguesFeatured ?? "Featured"}
          </p>
          <Link
            href="/catalogue"
            onClick={onNavigate}
            className="dx-link inline-flex items-center gap-1 text-sm font-bold"
          >
            {nav.labels.cataloguesAll ?? "Browse all catalogues"}
            <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {featured.map((c) => (
            <Link
              key={c.slug}
              href={c.href}
              onClick={onNavigate}
              className="group/card flex flex-col gap-3"
            >
              <span
                data-surface={c.surface}
                className="bg-surface relative block aspect-[16/9] overflow-hidden rounded-[10px]"
              >
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 30vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-(--ease-out-expo) group-hover/card:scale-105"
                />
              </span>
              <span className="text-[0.9375rem]">
                {c.title}{" "}
                <span className="text-surface-muted">· {c.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Superside's Resources menu: "Our resources" rows on the left, the latest
 * article and next event as image cards on the right.
 */
export function ResourcesPanel({
  onNavigate,
  highlights,
}: {
  onNavigate: () => void;
  highlights: ResourceHighlight[];
}) {
  const nav = useSiteNav();
  return (
    <div className="grid grid-cols-[1fr_2fr] gap-10">
      <div className="border-surface-rule flex flex-col border-r pr-10">
        <p className="mb-2 text-[0.9375rem]">Our resources</p>
        {nav.resources.map((r) => (
          <MenuRow
            key={r.href}
            href={r.href}
            title={r.title}
            description={r.description}
            icon={r.icon}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-[0.9375rem]">Latest</p>
        {highlights.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {highlights.slice(0, 2).map((h) => (
              <Link
                key={h.href}
                href={h.href}
                onClick={onNavigate}
                className="group/card flex flex-col gap-3"
              >
                <span className="bg-surface-fg/5 relative block aspect-[16/9] overflow-hidden rounded-[10px]">
                  <Image
                    src={h.image}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 30vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-(--ease-out-expo) group-hover/card:scale-105"
                  />
                  <span className="bg-canvas/90 text-charcoal absolute top-3 left-3 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold">
                    {h.label}
                  </span>
                </span>
                <span className="group-hover/card:text-brand line-clamp-2 text-[0.9375rem] transition-colors">
                  {h.title.replace(/\*/g, "")}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-surface-muted text-sm">
            New articles and events will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
