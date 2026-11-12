import type { ComponentType } from "react";
import {
  Activity,
  CalendarDays,
  GraduationCap,
  HandCoins,
  Home,
  Images,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  Layers,
  LayoutTemplate,
  Lightbulb,
  Settings as SettingsIcon,
  ShoppingBag,
  Mail,
  Palette,
  UserCircle,
  Users,
} from "lucide-react";
import {
  areaForPath,
  canAccess,
  type AdminArea,
  type AdminIdentity,
} from "@/lib/admin/permissions";

export type NavLink = {
  href: string;
  label: string;
  /** Extra words the command palette matches on. */
  keywords?: string;
  badge?: "unread";
  /** Who can see the link, when the URL alone doesn't say. */
  area?: AdminArea;
  /** Shown to anyone with one of these areas (instead of one `area`). */
  anyArea?: AdminArea[];
};

export type NavGroup = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Single link groups (Dashboard) have one item and no sub-menu. */
  items: NavLink[];
};

/**
 * The admin menu. Areas come from the URL (see lib/admin/permissions), so
 * a link is only shown to people who can open it. Pages being rebuilt in
 * later phases keep their current URLs here until then.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [{ href: "/admin", label: "Dashboard", keywords: "home overview" }],
  },
  {
    label: "Homepage",
    icon: Home,
    items: [
      {
        href: "/admin/pages/home",
        label: "Homepage",
        area: "home",
        keywords: "hero manifesto showcase sections home page",
      },
    ],
  },
  {
    label: "Media library",
    icon: Images,
    items: [
      {
        href: "/admin/media",
        label: "Media library",
        keywords:
          "images photos videos files upload documents cv pdf cloudinary",
      },
    ],
  },
  {
    label: "Pages",
    icon: LayoutTemplate,
    items: [
      {
        href: "/admin/pages/contact",
        label: "Contact page",
        area: "contact",
        keywords: "contact faq",
      },
      {
        href: "/admin/pages",
        label: "All pages",
        keywords:
          "sections content edit service pages templates seo search sharing",
      },
    ],
  },
  {
    label: "Services",
    icon: Layers,
    items: [
      {
        href: "/admin/pages/services",
        label: "Services page",
        area: "services",
      },
      {
        href: "/admin/services",
        label: "Manage services",
        keywords: "service groups design build print menu add hide reorder",
      },
    ],
  },
  {
    label: "Catalogues",
    icon: ShoppingBag,
    items: [
      {
        href: "/admin/pages/catalogue",
        label: "Catalogues page",
        area: "catalogue",
      },
      {
        href: "/admin/catalogues",
        label: "Manage catalogues",
        area: "catalogue",
        keywords:
          "catalogue designs items prices moq categories csv import wedding events",
      },
      {
        href: "/admin/pages/template.catalogue",
        label: "Catalogue page words",
        area: "catalogue",
        keywords: "filters order panel whatsapp labels template",
      },
    ],
  },
  {
    label: "Works",
    icon: ImageIcon,
    items: [
      {
        href: "/admin/pages/works",
        label: "Works page",
        area: "works",
        keywords: "portfolio page",
      },
      {
        href: "/admin/works",
        label: "Projects",
        area: "works",
        keywords: "portfolio works gallery featured",
      },
      {
        href: "/admin/pages/expressions",
        label: "Our Expressions page",
        area: "works",
        keywords: "products page",
      },
      {
        href: "/admin/expressions",
        label: "Our Expressions",
        area: "works",
        keywords: "products screenshots features story",
      },
      {
        href: "/admin/clients",
        label: "Clients",
        area: "works",
        keywords: "client logos brands",
      },
    ],
  },
  {
    label: "Thoughts",
    icon: Lightbulb,
    items: [
      {
        href: "/admin/pages/thoughts",
        label: "Thoughts page",
        area: "thoughts",
        keywords: "blog page filters trending",
      },
      {
        href: "/admin/thoughts",
        label: "Articles",
        area: "thoughts",
        keywords:
          "blog posts write publish schedule draft preview featured authors tags seo",
      },
      {
        href: "/admin/thoughts/categories",
        label: "Article categories",
        area: "thoughts",
        keywords: "blog categories",
      },
      {
        href: "/admin/pages/template.article",
        label: "Article page words",
        area: "thoughts",
        keywords: "tldr written by on this page keep reading template",
      },
    ],
  },
  {
    label: "Offers",
    icon: HandCoins,
    items: [
      {
        href: "/admin/pages/offers",
        label: "Offers page",
        area: "offers",
        keywords: "pricing page every offer includes questions",
      },
      {
        href: "/admin/offers",
        label: "Manage offers",
        area: "offers",
        keywords: "offers pricing plans price countdown payment link badge",
      },
    ],
  },
  {
    label: "Events",
    icon: CalendarDays,
    items: [
      {
        href: "/admin/pages/events",
        label: "Events page",
        area: "events",
      },
      {
        href: "/admin/events",
        label: "Manage events",
        area: "events",
        keywords: "event builder form fields capacity seats open closed",
      },
      {
        href: "/admin/registrations",
        label: "Registrations",
        area: "events",
        keywords: "attendees accept decline export csv",
      },
      {
        href: "/admin/pages/template.event",
        label: "Event page words",
        area: "events",
        keywords: "registration form labels template",
      },
      {
        href: "/admin/messaging",
        label: "Email attendees",
        area: "events",
        keywords: "messaging announcement email attendees reminder broadcast",
      },
    ],
  },
  {
    label: "About & team",
    icon: Info,
    items: [
      {
        href: "/admin/pages/about",
        label: "About page",
        area: "about",
        keywords: "story values journey space",
      },
      {
        href: "/admin/team",
        label: "Team",
        area: "about",
        keywords:
          "about people portfolio profile skills cv experience education",
      },
      {
        href: "/admin/pages/template.team",
        label: "Team profile page words",
        area: "about",
        keywords: "portfolio labels template",
      },
    ],
  },
  {
    label: "Inbox",
    icon: Mail,
    items: [
      {
        href: "/admin/inbox",
        label: "Inbox",
        anyArea: ["inbox", "contact", "events", "schools"],
        keywords:
          "messages contact form registrations applications schools reply assign export",
        badge: "unread",
      },
    ],
  },
  {
    label: "We Brand Schools",
    icon: GraduationCap,
    items: [
      {
        href: "/admin/we-brand-schools/applications",
        label: "Applications",
        keywords: "schools apply free website status go live",
      },
      {
        href: "/admin/we-brand-schools/projects",
        label: "Website projects",
        keywords: "schools editor export zip preview",
      },
      {
        href: "/admin/we-brand-schools/templates",
        label: "Templates",
        keywords: "schools designs screenshots videos demo",
      },
      {
        href: "/admin/we-brand-schools/referrals",
        label: "Referral links",
        keywords: "schools partners referrals visits",
      },
      {
        href: "/admin/we-brand-schools/testimonials",
        label: "Testimonials",
        keywords: "schools quotes logos",
      },
      {
        href: "/admin/we-brand-schools/portal",
        label: "Free portal",
        keywords: "schools portal cards features",
      },
      {
        href: "/admin/we-brand-schools/content",
        label: "The page",
        keywords: "schools hero overview process landing copy",
      },
    ],
  },
  {
    label: "Site settings",
    icon: SettingsIcon,
    items: [
      {
        href: "/admin/pages/site",
        label: "Site settings",
        area: "settings",
        keywords:
          "business details phone email address whatsapp social menus header footer seo site address occasions",
      },
    ],
  },
  {
    label: "Team & security",
    icon: Users,
    items: [
      {
        href: "/admin/users",
        label: "Users",
        keywords: "invite roles editors people",
      },
      {
        href: "/admin/activity",
        label: "Activity",
        keywords: "audit log history",
      },
    ],
  },
  {
    label: "Design kit",
    icon: Palette,
    items: [
      {
        href: "/admin/kit",
        label: "Design kit",
        keywords: "components preview",
      },
    ],
  },
];

/** Shown to everyone, at the bottom of the menu. */
export const ACCOUNT_LINK: NavLink = {
  href: "/admin/account",
  label: "Your account",
  keywords: "password profile name",
};
export const AccountIcon = UserCircle;
export const ActivityIcon = Activity;

/** The menu with only the links this user can open. */
export function navFor(user: AdminIdentity): NavGroup[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) =>
      item.anyArea
        ? item.anyArea.some((a) => canAccess(user, a))
        : canAccess(user, item.area ?? areaForPath(item.href.split("?")[0])),
    ),
  })).filter((g) => g.items.length > 0);
}

const LINKED_PAGES = new Set(
  NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href)).filter((h) =>
    h.startsWith("/admin/pages/"),
  ),
);

export function isLinkActive(
  href: string,
  pathname: string,
  section: string | null,
) {
  const [path, query] = href.split("?");
  if (path === "/admin") return pathname === "/admin";
  if (path === "/admin/pages") {
    // "All pages" also covers pages that have no menu link of their own.
    return (
      pathname === path ||
      (pathname.startsWith("/admin/pages/") && !LINKED_PAGES.has(pathname))
    );
  }
  if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
  if (query) {
    const want = new URLSearchParams(query).get("section");
    // The contact page opens on "content" when no section is given.
    return (section ?? "content") === want;
  }
  return true;
}
