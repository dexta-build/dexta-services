export type ContactSocialPlatform =
  | "LINKEDIN"
  | "INSTAGRAM"
  | "X"
  | "FACEBOOK"
  | "WHATSAPP"
  | "YOUTUBE"
  | "TIKTOK";

export type ContactPageContentData = {
  homeEyebrow: string;
  homeTitle: string;
  homeBody: string;
  homeCtaText: string;
  homeCtaHref: string;
  heroEyebrow: string;
  heroTitle: string;
  heroBody: string;
  infoEyebrow: string;
  infoTitle: string;
  infoBody: string;
  formEyebrow: string;
  formTitle: string;
  formBody: string;
  addressLabel: string;
  address: string;
  emailLabel: string;
  emails: string[];
  phoneLabel: string;
  phones: string[];
  socialsLabel: string;
};

export type ContactSocialLinkData = {
  platform: ContactSocialPlatform;
  label: string;
  href: string;
  isVisible: boolean;
  position: number;
};

export const CONTACT_PAGE_CONTENT_DEFAULTS: ContactPageContentData = {
  homeEyebrow: "Get in touch",
  homeTitle: "Let's Work Together",
  homeBody:
    "Ready to start a project or just have a question? We'd love to hear from you.",
  homeCtaText: "Contact Us",
  homeCtaHref: "/contact",
  heroEyebrow: "Contact Us",
  heroTitle: "Get In Touch",
  heroBody:
    "Have a project in mind? Let's bring your vision to life. Reach out and we'll get back to you shortly.",
  infoEyebrow: "Where to find us",
  infoTitle: "Contact Information",
  infoBody:
    "We're based in Port Harcourt, Nigeria and work with clients across the globe.",
  formEyebrow: "Send a message",
  formTitle: "Drop Us a Line",
  formBody: "Fill in the form and we'll respond within one business day.",
  addressLabel: "Address",
  address: "96 Elioparanwo Road, Port Harcourt, Rivers State, Nigeria",
  emailLabel: "Email",
  emails: ["info@dexta.services", "admin@dexta.services"],
  phoneLabel: "Phone",
  phones: ["+234 810 320 8287"],
  socialsLabel: "Follow Us",
};

export function parseJsonStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
