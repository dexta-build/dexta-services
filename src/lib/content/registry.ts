import "server-only";
import type { PageDef } from "./define";
import { SITE_PAGE } from "./pages/site";
import { HOME_PAGE } from "./pages/home";
import { MAIN_PAGES } from "./pages/main";
import { listServicePageDefs, resolveServicePageDef } from "./pages/services";
import { TEMPLATE_PAGES } from "./pages/templates";

/** Every editable page, in the order the admin lists them. */
export const PAGES: PageDef[] = [
  HOME_PAGE,
  ...MAIN_PAGES,
  ...TEMPLATE_PAGES,
  SITE_PAGE,
] as PageDef[];

const BY_KEY = new Map(PAGES.map((p) => [p.key, p]));

export function getPageDef(key: string): PageDef | undefined {
  return BY_KEY.get(key);
}

/** Any page, including group and service pages (built from the tables). */
export async function resolvePageDef(
  key: string,
): Promise<PageDef | undefined> {
  if (key.startsWith("service."))
    return (await resolveServicePageDef(key)) as PageDef | undefined;
  return getPageDef(key);
}

/** Every editable page, with the service pages in their Services order. */
export async function listPages(): Promise<PageDef[]> {
  const services = (await listServicePageDefs()) as PageDef[];
  const i = PAGES.findIndex((p) => p.group === "Page templates");
  return [...PAGES.slice(0, i), ...services, ...PAGES.slice(i)];
}
