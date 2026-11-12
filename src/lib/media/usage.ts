import "server-only";
import prisma from "@/lib/prisma";

/**
 * Where a file is used on the site. Content stores the Cloudinary public ID
 * (or the R2 URL) in many tables, so we look for the file's key in each
 * column that holds media. Add new columns here as later phases add them.
 */
type Source = {
  table: string;
  columns: string[];
  label: string;
  href: string | null;
  /** Old table the site no longer shows (kept for safe delete only). */
  legacy?: boolean;
};

const SOURCES: Source[] = [
  {
    table: "PageSection",
    columns: ["published", "draft"],
    label: "Page sections",
    href: "/admin/pages",
  },
  {
    table: "HeroContent",
    columns: ["backgroundImagePublicId", "cardFallbackImagePublicId"],
    label: "Homepage hero",
    href: "/admin/pages/home",
  },
  {
    table: "HeroCard",
    columns: ["imagePublicId"],
    label: "Homepage hero cards",
    href: "/admin/pages/home",
  },
  {
    table: "ServiceContent",
    columns: ["iconPublicId", "backgroundImagePublicId"],
    label: "Homepage service cards (old)",
    href: "/admin/pages/home",
  },
  {
    table: "ProjectsHeroContent",
    columns: ["backgroundImagePublicId"],
    label: "Works page (old)",
    href: null,
    legacy: true,
  },
  {
    table: "Service",
    columns: ["cardImage"],
    label: "Service cards",
    href: "/admin/services",
  },
  {
    table: "PortfolioItem",
    columns: ["mediaPublicId", "thumbnailPublicId"],
    label: "Projects",
    href: "/admin/works",
  },
  {
    table: "PortfolioAsset",
    columns: ["publicId", "thumbnailPublicId"],
    label: "Project galleries",
    href: "/admin/works",
  },
  {
    table: "Expression",
    columns: ["logoPublicId", "coverPublicId", "mobilePublicId", "gallery"],
    label: "Our Expressions",
    href: "/admin/expressions",
  },
  {
    table: "Client",
    columns: ["logoPublicId"],
    label: "Client logos",
    href: "/admin/clients",
  },
  {
    table: "Event",
    columns: ["imagePublicId"],
    label: "Events",
    href: "/admin/events",
  },
  {
    table: "OffersPageContent",
    columns: ["heroBgImagePublicId"],
    label: "Offers page (old)",
    href: null,
    legacy: true,
  },
  {
    table: "PricingPlan",
    columns: ["imagePublicId"],
    label: "Old offer plans",
    href: null,
    legacy: true,
  },
  {
    table: "AboutPageContent",
    columns: ["heroBackgroundImagePublicId"],
    label: "About page",
    href: "/admin/pages/about",
  },
  {
    table: "AboutTeamMember",
    columns: ["imagePublicId", "cvUrl", "projects"],
    label: "Team",
    href: "/admin/team",
  },
  {
    table: "AboutSpaceItem",
    columns: ["mediaPublicId", "thumbnailPublicId"],
    label: "Our space",
    href: "/admin/pages/about",
  },
  {
    table: "Catalogue",
    columns: ["coverPublicId"],
    label: "Catalogues",
    href: "/admin/catalogues",
  },
  {
    table: "CatalogueMedia",
    columns: ["publicId", "thumbnailPublicId"],
    label: "Catalogue designs",
    href: "/admin/catalogues",
  },
  {
    table: "Post",
    columns: ["coverPublicId", "content"],
    label: "Thoughts",
    href: "/admin/thoughts",
  },
  {
    table: "WeBrandSchoolsPageContent",
    columns: ["logoPublicId", "heroImagePublicId"],
    label: "We Brand Schools page",
    href: "/admin/we-brand-schools/content",
  },
  {
    table: "SchoolWebsiteTestimonial",
    columns: ["logoPublicId"],
    label: "School testimonials",
    href: "/admin/we-brand-schools/testimonials",
  },
  {
    table: "SchoolWebsiteTemplateAsset",
    columns: ["publicId", "thumbnailPublicId"],
    label: "School templates",
    href: "/admin/we-brand-schools/templates",
  },
  {
    table: "SchoolPortalFeatureAsset",
    columns: ["publicId", "thumbnailPublicId"],
    label: "School portal",
    href: "/admin/we-brand-schools/portal",
  },
];

export type MediaUsage = { label: string; count: number; href: string | null };

/** Every place the file appears. Tables that don't exist yet are skipped. */
export async function findUsage(needles: string[]): Promise<MediaUsage[]> {
  const terms = needles.filter((n) => n && n.length >= 6);
  if (terms.length === 0) return [];
  const results = await Promise.all(
    SOURCES.map(async (src) => {
      const conditions = src.columns
        .flatMap((col) =>
          terms.map(
            (_, i) => `position($${i + 1} in coalesce("${col}"::text, '')) > 0`,
          ),
        )
        .join(" OR ");
      try {
        const rows = await prisma.$queryRawUnsafe<{ n: number }[]>(
          `SELECT count(*)::int AS n FROM "${src.table}" WHERE ${conditions}`,
          ...terms,
        );
        const count = rows[0]?.n ?? 0;
        return count > 0 ? { label: src.label, count, href: src.href } : null;
      } catch {
        return null;
      }
    }),
  );
  return results.filter((r): r is MediaUsage => r !== null);
}

/** Columns that hold rich text or JSON, where media appear inside the text. */
const TEXT_COLUMNS = new Set(["content", "projects", "published", "draft"]);
/** Columns that hold a JSON list of media values. */
const JSON_LIST_COLUMNS = new Set(["gallery"]);

/**
 * Turns a stored value into a Cloudinary public ID on this site's account,
 * or null (local paths, other hosts, R2 links, other Cloudinary accounts).
 */
export function toCloudinaryPublicId(
  value: string,
  cloudName: string,
): string | null {
  const v = value.trim();
  if (!v || v.startsWith("/") || v.startsWith("data:")) return null;
  // Stock photo IDs (Unsplash, e.g. 1504868584819-f8e8b4b6d7e3) aren't ours.
  if (/^\d{10,13}-[0-9a-f]{8,14}$/.test(v)) return null;
  if (!/^https?:\/\//i.test(v)) return v;
  const m = v.match(
    /^https?:\/\/res\.cloudinary\.com\/([^/]+)\/(?:image|video)\/upload\/(.+)$/i,
  );
  if (!m || m[1] !== cloudName) return null;
  let parts = m[2].split("?")[0].split("/").filter(Boolean);
  const version = parts.findIndex((p) => /^v\d+$/.test(p));
  if (version >= 0) parts = parts.slice(version + 1);
  else
    while (
      parts.length > 1 &&
      /(^|,)[a-z]{1,3}_[^/]*/.test(parts[0]) &&
      !parts[0].includes(".")
    )
      parts = parts.slice(1);
  const id = parts.join("/").replace(/\.[a-z0-9]{2,5}$/i, "");
  return id || null;
}

/**
 * Every Cloudinary public ID this site's content refers to. Used to import
 * only this site's files from a Cloudinary account other projects share.
 */
export async function collectSiteCloudinaryIds(
  cloudName: string,
  { includeLegacy = true }: { includeLegacy?: boolean } = {},
): Promise<string[]> {
  const found = new Set<string>();
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const urlPattern = new RegExp(
    escape(`res.cloudinary.com/${cloudName}/`) +
      String.raw`(?:image|video)/upload/[^"'\s)<>]+`,
    "gi",
  );
  await Promise.all(
    SOURCES.filter((src) => includeLegacy || !src.legacy).flatMap((src) =>
      src.columns.map(async (col) => {
        try {
          const rows = await prisma.$queryRawUnsafe<{ v: string }[]>(
            `SELECT DISTINCT "${col}"::text AS v FROM "${src.table}" WHERE "${col}" IS NOT NULL AND "${col}"::text <> ''`,
          );
          for (const { v } of rows) {
            if (TEXT_COLUMNS.has(col)) {
              for (const url of v.match(urlPattern) ?? []) {
                const id = toCloudinaryPublicId(`https://${url}`, cloudName);
                if (id) found.add(id);
              }
              // Team projects: [{ image: "<public id>" }, …]
              if (col === "projects") {
                try {
                  const list = JSON.parse(v) as { image?: unknown }[];
                  for (const p of Array.isArray(list) ? list : []) {
                    if (typeof p?.image === "string") {
                      const id = toCloudinaryPublicId(p.image, cloudName);
                      if (id) found.add(id);
                    }
                  }
                } catch {
                  // Not JSON: URLs above are enough.
                }
              }
            } else if (JSON_LIST_COLUMNS.has(col)) {
              // Galleries: ["<public id or URL>", …]
              try {
                const list = JSON.parse(v) as unknown[];
                for (const item of Array.isArray(list) ? list : []) {
                  if (typeof item !== "string") continue;
                  const id = toCloudinaryPublicId(item, cloudName);
                  if (id) found.add(id);
                }
              } catch {
                // Not JSON: nothing to collect.
              }
            } else {
              const id = toCloudinaryPublicId(v, cloudName);
              if (id) {
                found.add(id);
                // Some old values include the file extension.
                const bare = id.replace(
                  /\.(jpe?g|png|webp|gif|svg|avif|mp4|webm|mov)$/i,
                  "",
                );
                if (bare !== id) found.add(bare);
              }
            }
          }
        } catch {
          // Table or column not there yet.
        }
      }),
    ),
  );
  return [...found];
}
