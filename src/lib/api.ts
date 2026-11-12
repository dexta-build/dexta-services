import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { aboutPrisma } from "@/lib/about-prisma";
import {
  listSchoolWebsiteTestimonials,
  weBrandSchoolsPrisma,
} from "@/lib/we-brand-schools-prisma";
import { getCloudinaryPublicId } from "./cloudinary";
import {
  ABOUT_CONTENT_TAG,
  ABOUT_EXPERTISE_TAG,
  ABOUT_MILESTONES_TAG,
  ABOUT_SPACE_TAG,
  ABOUT_VALUES_TAG,
} from "./about-cache";
import {
  ABOUT_EXPERTISE_DEFAULTS,
  ABOUT_MILESTONE_DEFAULTS,
  ABOUT_PAGE_CONTENT_DEFAULTS,
  ABOUT_VALUE_DEFAULTS,
  parseJsonStringArray as parseAboutJsonStringArray,
  type AboutExpertiseItemData,
  type AboutIconKey,
  type AboutMilestoneData,
  type AboutPageContentData,
  type AboutSpaceItemData,
  type AboutValueItemData,
} from "./about-defaults";
import {
  CONTACT_PAGE_CONTENT_DEFAULTS,
  parseJsonStringArray as parseContactJsonStringArray,
  type ContactPageContentData,
  type ContactSocialLinkData,
  type ContactSocialPlatform,
} from "./contact-defaults";
import { CONTACT_CONTENT_TAG, CONTACT_SOCIALS_TAG } from "./contact-cache";
import {
  SCHOOL_PORTAL_CARDS_TAG,
  SCHOOL_PORTAL_SECTION_TAG,
  WE_BRAND_SCHOOLS_CONTENT_TAG,
} from "./we-brand-schools-cache";
import {
  SCHOOL_PORTAL_SECTION_CONTENT_DEFAULTS,
  WE_BRAND_SCHOOLS_PAGE_CONTENT_DEFAULTS,
  parseJsonStringArray as parseWeBrandSchoolsJsonStringArray,
  type SchoolPortalFeatureCardData,
  type SchoolPortalSectionContentData,
  type SchoolWebsiteTestimonialData,
  type SchoolWebsiteTemplateData,
  withSchoolPortalSectionContentDefaults,
  type WeBrandSchoolsPageContentData,
  withWeBrandSchoolsPageContentDefaults,
} from "./we-brand-schools-defaults";

export const PORTFOLIO_TABS = ["ALL", "DESIGN", "BUILD", "PRINT"] as const;
export type PortfolioTab = (typeof PORTFOLIO_TABS)[number];
export type PortfolioServiceType = "DESIGN" | "BUILD" | "PRINT";
export type PortfolioMediaType = "IMAGE" | "VIDEO";

export type PortfolioAsset = {
  id: string;
  publicId: string;
  mediaType: PortfolioMediaType;
  thumbnailPublicId: string | null;
  caption: string | null;
  position: number;
};

export type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  serviceType: PortfolioServiceType;
  serviceLabel: string;
  tab: PortfolioTab;
  mediaType: PortfolioMediaType;
  mediaPublicId: string;
  thumbnailPublicId: string | null;
  websiteUrl: string | null;
  coverAssetId: string | null;
  position: number;
  assets: PortfolioAsset[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeStoredCloudinaryValue(value: string | null | undefined) {
  return value ? (getCloudinaryPublicId(value) ?? value) : null;
}

// ─── We Brand Schools ──────────────────────────────────────────────────────────

async function readWeBrandSchoolsPageContent(): Promise<WeBrandSchoolsPageContentData> {
  try {
    const row = await weBrandSchoolsPrisma.weBrandSchoolsPageContent.findFirst({
      orderBy: { id: "asc" },
    });

    if (!row) {
      return WE_BRAND_SCHOOLS_PAGE_CONTENT_DEFAULTS;
    }

    return withWeBrandSchoolsPageContentDefaults({
      logoPublicId: row.logoPublicId,
      heroImagePublicId: row.heroImagePublicId ?? null,
      heroEyebrow: row.heroEyebrow,
      heroHeadline: row.heroHeadline,
      heroBody: row.heroBody,
      heroPrimaryCtaText: row.heroPrimaryCtaText,
      heroPrimaryCtaHref: row.heroPrimaryCtaHref,
      heroSecondaryCtaText: row.heroSecondaryCtaText,
      heroSecondaryCtaHref: row.heroSecondaryCtaHref,
      heroFeature1: row.heroFeature1,
      heroFeature2: row.heroFeature2,
      heroFeature3: row.heroFeature3,
      overviewLabel: row.overviewLabel,
      overviewTitle: row.overviewTitle,
      overviewBody: row.overviewBody,
      overviewPrimaryCtaText: row.overviewPrimaryCtaText,
      overviewPrimaryCtaHref: row.overviewPrimaryCtaHref,
      overviewSecondaryCtaText: row.overviewSecondaryCtaText,
      overviewSecondaryCtaHref: row.overviewSecondaryCtaHref,
      overviewBenefitsLabel: row.overviewBenefitsLabel,
      overviewBenefit1: row.overviewBenefit1,
      overviewBenefit2: row.overviewBenefit2,
      overviewBenefit3: row.overviewBenefit3,
      overviewBenefit4: row.overviewBenefit4,
      processLabel: row.processLabel,
      processTitle: row.processTitle,
      processBody: row.processBody,
      processStep1Title: row.processStep1Title,
      processStep1Body: row.processStep1Body,
      processStep2Title: row.processStep2Title,
      processStep2Body: row.processStep2Body,
      processStep3Title: row.processStep3Title,
      processStep3Body: row.processStep3Body,
      processStep4Title: row.processStep4Title,
      processStep4Body: row.processStep4Body,
      templatesLabel: row.templatesLabel,
      templatesTitle: row.templatesTitle,
      templatesBody: row.templatesBody,
    });
  } catch {
    return WE_BRAND_SCHOOLS_PAGE_CONTENT_DEFAULTS;
  }
}

const fetchWeBrandSchoolsPageContentCached = unstable_cache(
  readWeBrandSchoolsPageContent,
  ["we-brand-schools-page-content"],
  { tags: [WE_BRAND_SCHOOLS_CONTENT_TAG] },
);

export async function fetchWeBrandSchoolsPageContent(): Promise<WeBrandSchoolsPageContentData> {
  return fetchWeBrandSchoolsPageContentCached();
}

async function readSchoolWebsiteTestimonials(): Promise<
  SchoolWebsiteTestimonialData[]
> {
  try {
    const rows = await listSchoolWebsiteTestimonials({ visibleOnly: true });

    return rows.map((row: SchoolWebsiteTestimonialData) => ({
      id: row.id,
      schoolName: row.schoolName,
      logoPublicId: row.logoPublicId ?? null,
      quote: row.quote,
      authorName: row.authorName,
      authorPosition: row.authorPosition,
      isVisible: row.isVisible,
      position: row.position,
    }));
  } catch {
    return [];
  }
}

export async function fetchSchoolWebsiteTestimonials(): Promise<
  SchoolWebsiteTestimonialData[]
> {
  return readSchoolWebsiteTestimonials();
}

async function readSchoolWebsiteTemplates(): Promise<
  SchoolWebsiteTemplateData[]
> {
  try {
    const rows = await weBrandSchoolsPrisma.schoolWebsiteTemplate.findMany({
      where: { isVisible: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        summary: true,
        description: true,
        websiteUrl: true,
        highlights: true,
        coverAssetId: true,
        isVisible: true,
        position: true,
        assets: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            publicId: true,
            mediaType: true,
            thumbnailPublicId: true,
            caption: true,
            position: true,
          },
        },
      },
    });

    if (!rows.length) {
      return [];
    }

    return rows.map(
      (row: {
        id: string;
        name: string;
        slug: string;
        summary: string;
        description: string | null;
        websiteUrl: string | null;
        highlights: string;
        coverAssetId: string | null;
        isVisible: boolean;
        position: number;
        assets: {
          id: string;
          publicId: string;
          mediaType: "IMAGE" | "VIDEO";
          thumbnailPublicId: string | null;
          caption: string | null;
          position: number;
        }[];
      }) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        summary: row.summary,
        description: row.description,
        websiteUrl: row.websiteUrl,
        highlights: parseWeBrandSchoolsJsonStringArray(row.highlights),
        coverAssetId: row.coverAssetId,
        isVisible: row.isVisible,
        position: row.position,
        assets: row.assets.map((asset) => ({
          id: asset.id,
          publicId: asset.publicId,
          mediaType: asset.mediaType,
          thumbnailPublicId: asset.thumbnailPublicId,
          caption: asset.caption,
          position: asset.position,
        })),
      }),
    );
  } catch {
    return [];
  }
}

export async function fetchSchoolWebsiteTemplates(): Promise<
  SchoolWebsiteTemplateData[]
> {
  return readSchoolWebsiteTemplates();
}

async function readSchoolPortalSectionContent(): Promise<SchoolPortalSectionContentData> {
  const row = await weBrandSchoolsPrisma.schoolPortalSectionContent.findFirst({
    orderBy: { id: "asc" },
    select: {
      eyebrow: true,
      title: true,
      description: true,
      ctaText: true,
      ctaHref: true,
      isVisible: true,
    },
  });

  if (!row) {
    return SCHOOL_PORTAL_SECTION_CONTENT_DEFAULTS;
  }

  return withSchoolPortalSectionContentDefaults({
    eyebrow: row.eyebrow,
    title: row.title,
    description: row.description,
    ctaText: row.ctaText ?? null,
    ctaHref: row.ctaHref ?? null,
    isVisible: row.isVisible,
  });
}

const fetchSchoolPortalSectionContentCached = unstable_cache(
  readSchoolPortalSectionContent,
  ["school-portal-section-content-v3"],
  { tags: [SCHOOL_PORTAL_SECTION_TAG] },
);

export async function fetchSchoolPortalSectionContent(): Promise<SchoolPortalSectionContentData> {
  try {
    return await fetchSchoolPortalSectionContentCached();
  } catch {
    return SCHOOL_PORTAL_SECTION_CONTENT_DEFAULTS;
  }
}

async function readSchoolPortalFeatureCards(): Promise<
  SchoolPortalFeatureCardData[]
> {
  const rows = await weBrandSchoolsPrisma.schoolPortalFeatureCard.findMany({
    where: { isVisible: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      summary: true,
      description: true,
      features: true,
      coverAssetId: true,
      youtubeUrl: true,
      isVisible: true,
      position: true,
      assets: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          publicId: true,
          mediaType: true,
          thumbnailPublicId: true,
          caption: true,
          position: true,
        },
      },
    },
  });

  if (!rows.length) {
    return [];
  }

  return rows.map(
    (row: {
      id: string;
      title: string;
      summary: string;
      description: string;
      features: string;
      coverAssetId: string | null;
      youtubeUrl: string | null;
      isVisible: boolean;
      position: number;
      assets: {
        id: string;
        publicId: string;
        mediaType: "IMAGE" | "VIDEO";
        thumbnailPublicId: string | null;
        caption: string | null;
        position: number;
      }[];
    }) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      description: row.description,
      features: parseWeBrandSchoolsJsonStringArray(row.features),
      coverAssetId: row.coverAssetId,
      youtubeUrl: row.youtubeUrl,
      isVisible: row.isVisible,
      position: row.position,
      assets: row.assets.map((asset) => ({
        id: asset.id,
        publicId: asset.publicId,
        mediaType: asset.mediaType,
        thumbnailPublicId: asset.thumbnailPublicId,
        caption: asset.caption,
        position: asset.position,
      })),
    }),
  );
}

const fetchSchoolPortalFeatureCardsCached = unstable_cache(
  readSchoolPortalFeatureCards,
  ["school-portal-feature-cards-v3"],
  { tags: [SCHOOL_PORTAL_CARDS_TAG] },
);

export async function fetchSchoolPortalFeatureCards(): Promise<
  SchoolPortalFeatureCardData[]
> {
  try {
    return await fetchSchoolPortalFeatureCardsCached();
  } catch {
    return [];
  }
}

// ─── Contact Page ─────────────────────────────────────────────────────────────

async function readContactPageContent(): Promise<ContactPageContentData> {
  try {
    const row = await prisma.contactPageContent.findUnique({
      where: { id: 1 },
    });

    if (!row) {
      return CONTACT_PAGE_CONTENT_DEFAULTS;
    }

    return {
      homeEyebrow: row.homeEyebrow,
      homeTitle: row.homeTitle,
      homeBody: row.homeBody,
      homeCtaText: row.homeCtaText,
      homeCtaHref: row.homeCtaHref,
      heroEyebrow: row.heroEyebrow,
      heroTitle: row.heroTitle,
      heroBody: row.heroBody,
      infoEyebrow: row.infoEyebrow,
      infoTitle: row.infoTitle,
      infoBody: row.infoBody,
      formEyebrow: row.formEyebrow,
      formTitle: row.formTitle,
      formBody: row.formBody,
      addressLabel: row.addressLabel,
      address: row.address,
      emailLabel: row.emailLabel,
      emails: parseContactJsonStringArray(row.emails),
      phoneLabel: row.phoneLabel,
      phones: parseContactJsonStringArray(row.phones),
      socialsLabel: row.socialsLabel,
    };
  } catch {
    return CONTACT_PAGE_CONTENT_DEFAULTS;
  }
}

const fetchContactPageContentCached = unstable_cache(
  readContactPageContent,
  ["contact-page-content"],
  { tags: [CONTACT_CONTENT_TAG] },
);

export async function fetchContactPageContent(): Promise<ContactPageContentData> {
  return fetchContactPageContentCached();
}

async function readContactSocialLinks(): Promise<ContactSocialLinkData[]> {
  try {
    const rows = await prisma.contactSocialLink.findMany({
      where: { isVisible: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        platform: true,
        label: true,
        href: true,
        isVisible: true,
        position: true,
      },
    });

    if (!rows.length) {
      return [];
    }

    return rows.map((row) => ({
      platform: row.platform as ContactSocialPlatform,
      label: row.label,
      href: row.href,
      isVisible: row.isVisible,
      position: row.position,
    }));
  } catch {
    return [];
  }
}

const fetchContactSocialLinksCached = unstable_cache(
  readContactSocialLinks,
  ["contact-social-links"],
  { tags: [CONTACT_SOCIALS_TAG] },
);

export async function fetchContactSocialLinks(): Promise<
  ContactSocialLinkData[]
> {
  return fetchContactSocialLinksCached();
}

// ─── About Page ───────────────────────────────────────────────────────────────

async function readAboutPageContent(): Promise<AboutPageContentData> {
  try {
    const row = await aboutPrisma.aboutPageContent.findFirst({
      orderBy: { id: "asc" },
    });

    if (!row) {
      return ABOUT_PAGE_CONTENT_DEFAULTS;
    }

    return {
      heroEyebrow: row.heroEyebrow,
      heroHeadline: row.heroHeadline,
      heroBody: row.heroBody,
      heroBackgroundImagePublicId: row.heroBackgroundImagePublicId,
      heroPrimaryCtaText: row.heroPrimaryCtaText,
      heroPrimaryCtaHref: row.heroPrimaryCtaHref,
      heroSecondaryCtaText: row.heroSecondaryCtaText,
      heroSecondaryCtaHref: row.heroSecondaryCtaHref,
      heroStat1Value: row.heroStat1Value,
      heroStat1Label: row.heroStat1Label,
      heroStat2Value: row.heroStat2Value,
      heroStat2Label: row.heroStat2Label,
      heroStat3Value: row.heroStat3Value,
      heroStat3Label: row.heroStat3Label,
      heroStat4Value: row.heroStat4Value,
      heroStat4Label: row.heroStat4Label,
      storyLabel: row.storyLabel,
      storyTitle: row.storyTitle,
      storyBody1: row.storyBody1,
      storyBody2: row.storyBody2,
      storyHighlightLabel: row.storyHighlightLabel,
      storyHighlightTitle: row.storyHighlightTitle,
      storyHighlightBody: row.storyHighlightBody,
      storyTrustedLabel: row.storyTrustedLabel,
      storyTrustedItems: parseAboutJsonStringArray(row.storyTrustedItems),
      expertiseLabel: row.expertiseLabel,
      expertiseTitle: row.expertiseTitle,
      expertiseBody: row.expertiseBody,
      teamLabel: row.teamLabel,
      teamTitle: row.teamTitle,
      teamBody: row.teamBody,
      cultureTitle: row.cultureTitle,
      cultureBody: row.cultureBody,
      teamNoteLabel: row.teamNoteLabel,
      teamPortfolioButtonText: row.teamPortfolioButtonText,
      spaceLabel: row.spaceLabel,
      spaceTitle: row.spaceTitle,
      spaceBody: row.spaceBody,
      valuesLabel: row.valuesLabel,
      valuesTitle: row.valuesTitle,
      valuesBody: row.valuesBody,
      ctaLabel: row.ctaLabel,
      ctaTitle: row.ctaTitle,
      ctaBody: row.ctaBody,
      ctaText: row.ctaText,
      ctaHref: row.ctaHref,
    };
  } catch {
    return ABOUT_PAGE_CONTENT_DEFAULTS;
  }
}

const fetchAboutPageContentCached = unstable_cache(
  readAboutPageContent,
  ["about-page-content"],
  { tags: [ABOUT_CONTENT_TAG] },
);

export async function fetchAboutPageContent(): Promise<AboutPageContentData> {
  return fetchAboutPageContentCached();
}

async function readAboutMilestones(): Promise<AboutMilestoneData[]> {
  try {
    const rows = await aboutPrisma.aboutMilestone.findMany({
      where: { isVisible: true },
      orderBy: { position: "asc" },
    });

    if (!rows.length) {
      return ABOUT_MILESTONE_DEFAULTS.filter((item) => item.isVisible);
    }

    return rows.map(
      (row: {
        year: string;
        title: string;
        description: string;
        isVisible: boolean;
        position: number;
      }) => ({
        year: row.year,
        title: row.title,
        description: row.description,
        isVisible: row.isVisible,
        position: row.position,
      }),
    );
  } catch {
    return ABOUT_MILESTONE_DEFAULTS.filter((item) => item.isVisible);
  }
}

const fetchAboutMilestonesCached = unstable_cache(
  readAboutMilestones,
  ["about-milestones"],
  { tags: [ABOUT_MILESTONES_TAG] },
);

export async function fetchAboutMilestones(): Promise<AboutMilestoneData[]> {
  return fetchAboutMilestonesCached();
}

async function readAboutExpertiseItems(): Promise<AboutExpertiseItemData[]> {
  try {
    const rows = await aboutPrisma.aboutExpertiseItem.findMany({
      where: { isVisible: true },
      orderBy: { position: "asc" },
    });

    if (!rows.length) {
      return ABOUT_EXPERTISE_DEFAULTS.filter((item) => item.isVisible);
    }

    return rows.map(
      (row: {
        icon: AboutIconKey;
        title: string;
        description: string;
        metricLabel: string;
        metricValue: string;
        isVisible: boolean;
        position: number;
      }) => ({
        icon: row.icon as AboutIconKey,
        title: row.title,
        description: row.description,
        metricLabel: row.metricLabel,
        metricValue: row.metricValue,
        isVisible: row.isVisible,
        position: row.position,
      }),
    );
  } catch {
    return ABOUT_EXPERTISE_DEFAULTS.filter((item) => item.isVisible);
  }
}

const fetchAboutExpertiseItemsCached = unstable_cache(
  readAboutExpertiseItems,
  ["about-expertise-items"],
  { tags: [ABOUT_EXPERTISE_TAG] },
);

export async function fetchAboutExpertiseItems(): Promise<
  AboutExpertiseItemData[]
> {
  return fetchAboutExpertiseItemsCached();
}

async function readAboutSpaceItems(): Promise<AboutSpaceItemData[]> {
  try {
    const aboutSpaceItem = (
      aboutPrisma as typeof aboutPrisma & {
        aboutSpaceItem?: {
          findMany: (args: {
            where: { isVisible: true };
            orderBy: { position: "asc" };
          }) => Promise<
            Array<{
              title: string;
              description: string;
              mediaType: AboutSpaceItemData["mediaType"];
              mediaPublicId: string | null;
              thumbnailPublicId: string | null;
              isVisible: boolean;
              position: number;
            }>
          >;
        };
      }
    ).aboutSpaceItem;

    if (!aboutSpaceItem) {
      return [];
    }

    const rows = await aboutSpaceItem.findMany({
      where: { isVisible: true },
      orderBy: { position: "asc" },
    });

    return rows.map(
      (row: {
        title: string;
        description: string;
        mediaType: AboutSpaceItemData["mediaType"];
        mediaPublicId: string | null;
        thumbnailPublicId: string | null;
        isVisible: boolean;
        position: number;
      }) => ({
        title: row.title,
        description: row.description,
        mediaType: row.mediaType,
        mediaPublicId: normalizeStoredCloudinaryValue(row.mediaPublicId),
        thumbnailPublicId: normalizeStoredCloudinaryValue(
          row.thumbnailPublicId,
        ),
        isVisible: row.isVisible,
        position: row.position,
      }),
    );
  } catch {
    return [];
  }
}

const fetchAboutSpaceItemsCached = unstable_cache(
  readAboutSpaceItems,
  ["about-space-items"],
  { tags: [ABOUT_SPACE_TAG] },
);

export async function fetchAboutSpaceItems(): Promise<AboutSpaceItemData[]> {
  return fetchAboutSpaceItemsCached();
}

async function readAboutValueItems(): Promise<AboutValueItemData[]> {
  try {
    const rows = await aboutPrisma.aboutValueItem.findMany({
      where: { isVisible: true },
      orderBy: { position: "asc" },
    });

    if (!rows.length) {
      return ABOUT_VALUE_DEFAULTS.filter((item) => item.isVisible);
    }

    return rows.map(
      (row: {
        icon: AboutIconKey;
        title: string;
        description: string;
        isVisible: boolean;
        position: number;
      }) => ({
        icon: row.icon as AboutIconKey,
        title: row.title,
        description: row.description,
        isVisible: row.isVisible,
        position: row.position,
      }),
    );
  } catch {
    return ABOUT_VALUE_DEFAULTS.filter((item) => item.isVisible);
  }
}

const fetchAboutValueItemsCached = unstable_cache(
  readAboutValueItems,
  ["about-value-items"],
  { tags: [ABOUT_VALUES_TAG] },
);

export async function fetchAboutValueItems(): Promise<AboutValueItemData[]> {
  return fetchAboutValueItemsCached();
}
