import "server-only";
import { cache } from "react";
import { resolveWhatsAppHref, whatsAppHref } from "@/lib/site/whatsapp";
import type {
  ContactSocialLinkData,
  ContactSocialPlatform,
} from "@/lib/contact-defaults";
import { loadPage } from "./store";
import { SITE_PAGE } from "./pages/site";

/** All site-wide settings (published, or drafts while previewing). */
export const getSiteSettings = cache(async () => {
  const { data } = await loadPage(SITE_PAGE);
  return data;
});

export type WhatsAppKey = keyof Awaited<
  ReturnType<typeof getSiteSettings>
>["whatsapp"];

/** Social links in the shape the site components use. */
export function socialLinks(
  b: Awaited<ReturnType<typeof getSiteSettings>>["business"],
): ContactSocialLinkData[] {
  return b.socials.map((s, i) => ({
    platform: s.platform as ContactSocialPlatform,
    label: s.label,
    href: s.href,
    isVisible: s.isVisible,
    position: i,
  }));
}

/**
 * The WhatsApp link with the message for this part of the site.
 * `vars` fills {placeholders}, e.g. { title: "Brand refresh" }.
 */
export async function getWhatsApp(
  key: WhatsAppKey = "general",
  vars: Record<string, string> = {},
) {
  const { business, whatsapp } = await getSiteSettings();
  const message = (whatsapp[key] || whatsapp.general).replace(
    /\{(\w+)\}/g,
    (m, k: string) => vars[k] ?? m,
  );
  if (business.whatsappNumber?.trim())
    return whatsAppHref(business.whatsappNumber, message);
  return resolveWhatsAppHref(socialLinks(business), business.phones, message);
}

/** The live site address from settings, else the environment. */
export async function getSiteUrl() {
  const { seo } = await getSiteSettings();
  return (seo.siteUrl || "").replace(/\/+$/, "") || undefined;
}
