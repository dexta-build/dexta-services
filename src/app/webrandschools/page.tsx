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
import { WE_BRAND_SCHOOLS_PAGE } from "@/lib/content/pages/main";
import { pageMetadata } from "@/lib/content/seo";
import { loadPage } from "@/lib/content/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(WE_BRAND_SCHOOLS_PAGE);
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
    page,
  ] = await Promise.all([
    fetchWeBrandSchoolsPageContent(),
    fetchSchoolWebsiteTestimonials(),
    fetchSchoolWebsiteTemplates(),
    fetchSchoolPortalSectionContent(),
    fetchSchoolPortalFeatureCards(),
    getSiteSettings(),
    getWhatsApp("general"),
    loadPage(WE_BRAND_SCHOOLS_PAGE),
  ]);

  return (
    <SchoolsPage
      labels={page.data.labels}
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
