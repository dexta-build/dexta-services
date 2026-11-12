import "server-only";

import { getSiteSettings, socialLinks } from "@/lib/content/site-settings";
import { resolveWhatsAppHref, whatsAppHref } from "./whatsapp";

/**
 * The site's WhatsApp link with a specific opening message. Prefer
 * getWhatsApp(key) from content/site-settings, whose messages are editable.
 */
export async function getWhatsAppHref(
  message?: string,
): Promise<string | null> {
  const { business } = await getSiteSettings();
  if (business.whatsappNumber?.trim())
    return whatsAppHref(business.whatsappNumber, message);
  return resolveWhatsAppHref(socialLinks(business), business.phones, message);
}
