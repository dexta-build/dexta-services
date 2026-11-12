import type { ContactSocialLinkData } from "@/lib/contact-defaults";

/**
 * Builds a wa.me link. Accepts any phone format ("+234 803 000 0000",
 * "0803...") and normalises Nigerian local numbers to +234.
 */
export function whatsAppHref(phone: string, message?: string): string | null {
  let digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.startsWith("0") && digits.length === 11) {
    digits = `234${digits.slice(1)}`;
  }
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

/**
 * The site's WhatsApp link: the WhatsApp social link if the admin set one,
 * otherwise built from the first phone number.
 */
export function resolveWhatsAppHref(
  socials: ContactSocialLinkData[],
  phones: string[],
  message?: string,
): string | null {
  const social = socials.find(
    (s) => s.platform === "WHATSAPP" && s.isVisible && s.href,
  );
  if (social) {
    if (!message) return social.href;
    try {
      const url = new URL(social.href);
      url.searchParams.set("text", message);
      return url.toString();
    } catch {
      return social.href;
    }
  }
  return phones[0] ? whatsAppHref(phones[0], message) : null;
}
