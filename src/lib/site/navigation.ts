/**
 * Site navigation content for the public shell (header, mobile menu, footer).
 *
 * Static for now. In the admin phase, services and catalogues will come from
 * the database; keep the shapes here so the swap is a data change only.
 */
import type { Surface } from "@/components/site/section";
import { STOCK, stock } from "./stock-media";

export type NavIcon =
  | "palette"
  | "pen"
  | "share"
  | "presentation"
  | "package"
  | "sparkles"
  | "globe"
  | "app"
  | "cart"
  | "code"
  | "school"
  | "wrench"
  | "mail"
  | "book"
  | "card"
  | "flag"
  | "shirt"
  | "maximize"
  | "heart"
  | "flower"
  | "party"
  | "cake"
  | "monitor"
  | "briefcase"
  | "calendar"
  | "lightbulb";

export type ServiceLink = {
  title: string;
  description: string;
  href: string;
  icon: NavIcon;
};

export type ServiceGroup = {
  key: "design" | "build" | "print";
  title: string;
  href: string;
  /** Pill colours in the mega-menu. */
  pillClass: string;
  items: ServiceLink[];
};

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    key: "design",
    title: "Design",
    href: "/services/design",
    pillClass: "bg-brand-cyan text-royal",
    items: [
      {
        title: "Brand identity",
        description: "Logos, systems and guidelines",
        href: "/services/design/brand-identity",
        icon: "palette",
      },
      {
        title: "Social media creative",
        description: "Scroll-stopping posts and ads",
        href: "/services/design/social-media-creative",
        icon: "share",
      },
      {
        title: "Presentation design",
        description: "Decks that win the room",
        href: "/services/design/presentation-design",
        icon: "presentation",
      },
      {
        title: "Packaging design",
        description: "Shelf-ready product packaging",
        href: "/services/design/packaging-design",
        icon: "package",
      },
      {
        title: "Illustration & motion",
        description: "Visual stories that move",
        href: "/services/design/illustration-motion",
        icon: "pen",
      },
      {
        title: "UI/UX design",
        description: "Interfaces people enjoy",
        href: "/services/design/ui-ux-design",
        icon: "sparkles",
      },
    ],
  },
  {
    key: "build",
    title: "Build",
    href: "/services/build",
    pillClass: "bg-royal text-ice",
    items: [
      {
        title: "Websites",
        description: "Fast, beautiful, easy to update",
        href: "/services/build/websites",
        icon: "globe",
      },
      {
        title: "Web applications",
        description: "Custom platforms and dashboards",
        href: "/services/build/web-applications",
        icon: "code",
      },
      {
        title: "Mobile apps",
        description: "iOS and Android experiences",
        href: "/services/build/mobile-apps",
        icon: "app",
      },
      {
        title: "E-commerce",
        description: "Online stores that sell",
        href: "/services/build/e-commerce",
        icon: "cart",
      },
      {
        title: "School portals",
        description: "Websites and portals for schools",
        href: "/webrandschools",
        icon: "school",
      },
      {
        title: "Support & maintenance",
        description: "Hosting, updates and care",
        href: "/services/build/support-maintenance",
        icon: "wrench",
      },
    ],
  },
  {
    key: "print",
    title: "Print",
    href: "/services/print",
    pillClass: "bg-ocean text-white",
    items: [
      {
        title: "Invitation cards",
        description: "Weddings, events and more",
        href: "/services/print/invitation-cards",
        icon: "mail",
      },
      {
        title: "Brochures & flyers",
        description: "Print that informs and sells",
        href: "/services/print/brochures-flyers",
        icon: "book",
      },
      {
        title: "Business stationery",
        description: "Cards, letterheads, envelopes",
        href: "/services/print/business-stationery",
        icon: "card",
      },
      {
        title: "Banners & signage",
        description: "Roll-ups, flex and billboards",
        href: "/services/print/banners-signage",
        icon: "flag",
      },
      {
        title: "Branded merchandise",
        description: "Shirts, totes, mugs and gifts",
        href: "/services/print/branded-merchandise",
        icon: "shirt",
      },
      {
        title: "Large format",
        description: "Big prints, perfect finish",
        href: "/services/print/large-format",
        icon: "maximize",
      },
    ],
  },
];

export type CatalogueLink = {
  slug: string;
  title: string;
  description: string;
  href: string;
  icon: NavIcon;
  surface: Surface;
  /** Placeholder thumbnail until catalogue media comes from the admin. */
  image: string;
  featured?: boolean;
  /** Sample categories shown in previews until the admin manages them. */
  categories: string[];
};

export const CATALOGUES: CatalogueLink[] = [
  {
    slug: "wedding",
    categories: [
      "Invitation cards",
      "Programmes",
      "Souvenirs",
      "Welcome signage",
      "Thank-you cards",
      "Backdrops",
    ],
    title: "Wedding",
    description: "Invitations, programmes, souvenirs",
    href: "/catalogue/wedding",
    icon: "heart",
    surface: "gold",
    image: stock(STOCK.weddingRings, 1200, 900),
    featured: true,
  },
  {
    slug: "events",
    categories: [
      "Event branding",
      "Banners",
      "Wristbands & tags",
      "Backdrops",
      "Merch",
      "Social graphics",
    ],
    title: "Events",
    description: "Branding for launches and parties",
    href: "/catalogue/events",
    icon: "party",
    surface: "coral",
    image: stock(STOCK.eventStage, 1200, 900),
    featured: true,
  },
  {
    slug: "burial",
    categories: [
      "Brochures",
      "Banners",
      "Funeral programmes",
      "Memorial keepsakes",
      "Customised fabrics",
      "Posters",
    ],
    title: "Burial & memorial",
    description: "Brochures, banners, keepsakes",
    href: "/catalogue/burial",
    icon: "flower",
    surface: "stone",
    image: stock(STOCK.notebook, 1200, 900),
  },
  {
    slug: "birthdays",
    categories: [
      "Invitation cards",
      "Backdrops",
      "Cake toppers",
      "Party favours",
      "Banners",
      "Social graphics",
    ],
    title: "Birthdays",
    description: "Cards, backdrops and gifts",
    href: "/catalogue/birthdays",
    icon: "cake",
    surface: "lilac",
    image: stock(STOCK.balloons, 1200, 900),
  },
  {
    slug: "apps-websites",
    categories: [
      "Business websites",
      "Online stores",
      "Portfolio sites",
      "School portals",
      "Booking apps",
      "Landing pages",
    ],
    title: "Apps & websites",
    description: "Ready-to-launch digital packages",
    href: "/catalogue/apps-websites",
    icon: "monitor",
    surface: "mint",
    image: stock(STOCK.laptopBrowsing, 1200, 900),
  },
  {
    slug: "corporate",
    categories: [
      "Business cards",
      "Letterheads",
      "Branded merch",
      "Roll-up banners",
      "ID cards",
      "Notebooks",
    ],
    title: "Corporate",
    description: "Stationery, merch and signage",
    href: "/catalogue/corporate",
    icon: "briefcase",
    surface: "ice",
    image: stock(STOCK.teamMeeting, 1200, 900),
  },
];

export type NavLink = { label: string; href: string };

/** Top-level links after the two dropdowns, in order. */
export const MAIN_LINKS: NavLink[] = [
  { label: "Offers", href: "/offers" },
  { label: "Works", href: "/works" },
  { label: "About", href: "/about" },
];

/** The desktop Resources menu sits after this link. */
export const RESOURCES_AFTER = "/works";

export type ResourceLink = {
  title: string;
  description: string;
  href: string;
  icon: NavIcon;
};

/** "Resources" menu, like Superside's: Events, Thoughts and more. */
export const RESOURCES: ResourceLink[] = [
  {
    title: "Events",
    description: "Workshops, meet-ups and open days",
    href: "/events",
    icon: "calendar",
  },
  {
    title: "Thoughts",
    description: "Ideas, guides and stories from our team",
    href: "/thoughts",
    icon: "lightbulb",
  },
  {
    title: "Our Expressions",
    description: "Products designed, built and run by Dexta",
    href: "/expressions",
    icon: "sparkles",
  },
  {
    title: "Case studies",
    description: "Behind the projects we're proud of",
    href: "/works",
    icon: "briefcase",
  },
];

/** A featured card on the right of the Resources menu. */
export type ResourceHighlight = {
  label: string;
  title: string;
  href: string;
  image: string;
};

export const PRIMARY_CTA: NavLink = {
  label: "Talk to us",
  href: "/contact",
};

export const FOOTER_COMPANY_LINKS: NavLink[] = [
  { label: "Works", href: "/works" },
  { label: "Offers", href: "/offers" },
  { label: "Thoughts", href: "/thoughts" },
  { label: "Events", href: "/events" },
  { label: "Our Expressions", href: "/expressions" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "We Brand Schools", href: "/webrandschools" },
];

/**
 * Routes whose hero is dark (royal). The header matches it so the top of the
 * page reads as one block, like Superside. Everything else gets the cream
 * header. Matched as exact paths or "prefix/*".
 */
const DARK_HEADER_ROUTES = [
  "/",
  "/design-system",
  "/about",
  "/offers",
  "/services",
  "/services/*",
];

export function headerSurfaceFor(pathname: string): "royal" | "canvas" {
  const dark = DARK_HEADER_ROUTES.some((route) =>
    route.endsWith("/*")
      ? pathname.startsWith(route.slice(0, -1))
      : pathname === route,
  );
  return dark ? "royal" : "canvas";
}

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
