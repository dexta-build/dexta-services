import type { Metadata } from "next";
import { SchoolsPage } from "@/components/site/schools/schools-page";
import {
  getSiteSettings,
  getWhatsApp,
  socialLinks,
} from "@/lib/content/site-settings";
import {
  fetchSchoolPortalFeatureCards,
  fetchSchoolPortalSectionContent,
  fetchSchoolWebsiteTemplates,
  fetchSchoolWebsiteTestimonials,
  fetchWeBrandSchoolsPageContent,
} from "@/lib/api";
import { stripHtml } from "@/lib/site/home-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await fetchWeBrandSchoolsPageContent();
  return {
    title: "We Brand Schools",
    description: stripHtml(content.heroBody).slice(0, 160),
    alternates: { canonical: "/webrandschools" },
  };
}

export default async function WeBrandSchoolsRoute() {
  const [
    content,
    testimonials,
    templates,
    portalSectionContent,
    portalCards,
    site,
    whatsappHref,
  ] = await Promise.all([
    fetchWeBrandSchoolsPageContent(),
    fetchSchoolWebsiteTestimonials(),
    fetchSchoolWebsiteTemplates(),
    fetchSchoolPortalSectionContent(),
    fetchSchoolPortalFeatureCards(),
    getSiteSettings(),
    getWhatsApp("general"),
  ]);

  return (
    <SchoolsPage
      content={content}
      testimonials={testimonials}
      templates={templates}
      portalSectionContent={portalSectionContent}
      portalCards={portalCards}
      contact={{
        emails: site.business.emails,
        phones: site.business.phones,
        socials: socialLinks(site.business).filter((s) => s.isVisible),
        whatsappHref: whatsappHref || null,
      }}
    />
  );
}
