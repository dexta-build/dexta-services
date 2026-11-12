/**
 * Admin roles and access areas. Shared by server and client code (no
 * secrets here): the server enforces access, the client only uses it to
 * hide what a user can't open.
 *
 * - Admin: the owner. Everything, including users, settings and activity.
 * - Editor: can manage and publish the content areas they've been given.
 *
 * Add a role later by extending AdminRole and `ROLE_LABELS`.
 */

export type AdminRole = "ADMIN" | "EDITOR";

export const ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  ADMIN: "Owner access: everything, including users, settings and activity.",
  EDITOR: "Can edit and publish the areas you choose below.",
};

/** Content areas an Editor can be given. */
export const CONTENT_AREAS = [
  {
    key: "home",
    label: "Homepage",
    description: "Hero, sections and showcase",
  },
  {
    key: "services",
    label: "Services",
    description: "Service groups and pages",
  },
  {
    key: "catalogue",
    label: "Catalogues",
    description: "Catalogues, items and prices",
  },
  { key: "offers", label: "Offers", description: "Offers and the Offers page" },
  {
    key: "works",
    label: "Works & products",
    description: "Projects, Our Expressions, clients",
  },
  {
    key: "thoughts",
    label: "Thoughts",
    description: "Articles and categories",
  },
  { key: "events", label: "Events", description: "Events and registrations" },
  {
    key: "about",
    label: "About & team",
    description: "About page and team portfolios",
  },
  {
    key: "contact",
    label: "Contact",
    description: "Contact page, details and socials",
  },
  { key: "inbox", label: "Inbox", description: "Messages and enquiries" },
  {
    key: "media",
    label: "Media library",
    description: "Images, videos and files",
  },
  {
    key: "schools",
    label: "We Brand Schools",
    description: "Schools programme",
  },
] as const;

export type ContentArea = (typeof CONTENT_AREAS)[number]["key"];

/** Areas only Admins can open. */
export const ADMIN_ONLY_AREAS = ["users", "activity", "settings"] as const;
export type AdminOnlyArea = (typeof ADMIN_ONLY_AREAS)[number];

export type AdminArea = ContentArea | AdminOnlyArea;

export const ALL_CONTENT_AREAS: ContentArea[] = CONTENT_AREAS.map((a) => a.key);

export type AdminIdentity = {
  role: AdminRole;
  access: string[];
};

/** Can this user open/manage the area? Admins can do everything. */
export function canAccess(user: AdminIdentity, area?: AdminArea | null) {
  if (!area) return true;
  if (user.role === "ADMIN") return true;
  if ((ADMIN_ONLY_AREAS as readonly string[]).includes(area)) return false;
  return user.access.includes(area);
}

/**
 * Which area an admin URL belongs to, so pages can be gated in one place.
 * Unlisted paths (the dashboard, your account) are open to every signed-in
 * user.
 */
const PATH_AREAS: [prefix: string, area: AdminArea][] = [
  ["/admin/users", "users"],
  ["/admin/activity", "activity"],
  ["/admin/settings", "settings"],
  ["/admin/kit", "settings"],
  ["/admin/services", "services"],
  ["/admin/home", "home"],
  ["/admin/catalogue", "catalogue"],
  ["/admin/offers", "offers"],
  ["/admin/expressions", "works"],
  ["/admin/works", "works"],
  ["/admin/clients", "works"],
  ["/admin/thoughts", "thoughts"],
  ["/admin/events", "events"],
  ["/admin/registrations", "events"],
  ["/admin/about", "about"],
  ["/admin/team", "about"],
  ["/admin/contact", "contact"],
  ["/admin/messaging", "events"],
  // /admin/inbox: open to anyone with inbox, contact, events or schools
  // access; the page shows each person only their part (lib/inbox).
  ["/admin/media", "media"],
  ["/admin/we-brand-schools", "schools"],
];

export function areaForPath(pathname: string): AdminArea | null {
  const hit = PATH_AREAS.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return hit ? hit[1] : null;
}

/** Admin pages anyone can reach without signing in. */
export const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
  "/admin/invite",
];

export function isPublicAdminPath(pathname: string) {
  return PUBLIC_ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
