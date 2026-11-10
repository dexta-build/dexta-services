import "server-only";

import { fetchContactPageContent, fetchContactSocialLinks } from "@/lib/api";
import { resolveWhatsAppHref } from "./whatsapp";

/** The site's WhatsApp link, optionally with a page-specific opening message. */
export async function getWhatsAppHref(
  message?: string,
): Promise<string | null> {
  const [contact, socials] = await Promise.all([
    fetchContactPageContent(),
    fetchContactSocialLinks(),
  ]);
  return resolveWhatsAppHref(socials, contact.phones, message);
}
