import { z } from "zod";

const optionalCloudinaryPublicIdSchema = z
  .string()
  .trim()
  .max(500, "Image public ID must be 500 characters or less")
  .optional()
  .nullable();

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500, "URL must be 500 characters or less")
  .url("Please enter a valid URL")
  .optional()
  .nullable()
  .or(z.literal(""));

function requiredUrlSchema(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(500, `${label} must be 500 characters or less`)
    .url(`Please enter a valid ${label.toLowerCase()}`);
}

const optionalYoutubeUrlSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  },
  z
    .string()
    .max(500, "YouTube URL must be 500 characters or less")
    .url("Please enter a valid YouTube URL")
    .refine((value) => {
      try {
        const hostname = new URL(value).hostname.toLowerCase();
        return (
          hostname === "youtu.be" ||
          hostname === "youtube.com" ||
          hostname.endsWith(".youtube.com")
        );
      } catch {
        return false;
      }
    }, "YouTube URL must be from youtube.com or youtu.be")
    .nullable()
    .optional(),
);

function requiredTrimmedString(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or less`);
}

function requiredRichTextString(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(12000, `${label} has too much formatting data`);
}

function optionalTrimmedString(label: string, max: number) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    },
    z
      .string()
      .max(max, `${label} must be ${max} characters or less`)
      .nullable()
      .optional(),
  );
}

export const SCHOOL_WEBSITE_TESTIMONIAL_MAX_CHARACTERS = 170;
export const SCHOOL_WEBSITE_TESTIMONIAL_MAX_SCHOOL_NAME_CHARACTERS = 40;
export const SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_NAME_CHARACTERS = 32;
export const SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_POSITION_CHARACTERS = 32;

function jsonStringArrayUpToSchema(
  label: string,
  maxItems: number,
  maxItemLength: number,
) {
  return z
    .string()
    .trim()
    .refine(
      (value) => {
        try {
          const parsed = JSON.parse(value);

          return (
            Array.isArray(parsed) &&
            parsed.length <= maxItems &&
            parsed.every(
              (item) =>
                typeof item === "string" &&
                item.trim().length > 0 &&
                item.trim().length <= maxItemLength,
            )
          );
        } catch {
          return false;
        }
      },
      {
        message: `${label} must be a JSON array of up to ${maxItems} non-empty strings`,
      },
    );
}

export const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters." })
    .max(500, { message: "Message must be less than 500 characters." }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export type ContactFormState = {
  success?: boolean;
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
};
const mediaTypeSchema = z.enum(["IMAGE", "VIDEO"]);
const schoolWebsiteJobStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "LIVE",
  "DECLINED",
]);
const schoolWebsiteDomainChoiceSchema = z.enum(["HAS_DOMAIN", "NEEDS_DOMAIN"]);

// ─── We Brand Schools ──────────────────────────────────────────────────────────

export const weBrandSchoolsPageContentSchema = z.object({
  logoPublicId: optionalCloudinaryPublicIdSchema,
  heroImagePublicId: optionalCloudinaryPublicIdSchema,
  heroEyebrow: requiredTrimmedString("Hero eyebrow", 120),
  heroHeadline: requiredTrimmedString("Hero headline", 220),
  heroBody: requiredTrimmedString("Hero body", 2000),
  heroPrimaryCtaText: requiredTrimmedString("Primary CTA text", 100),
  heroPrimaryCtaHref: requiredTrimmedString("Primary CTA link", 500),
  heroSecondaryCtaText: requiredTrimmedString("Secondary CTA text", 100),
  heroSecondaryCtaHref: requiredTrimmedString("Secondary CTA link", 500),
  heroFeature1: requiredRichTextString("Hero feature 1"),
  heroFeature2: requiredRichTextString("Hero feature 2"),
  heroFeature3: requiredRichTextString("Hero feature 3"),
  overviewLabel: requiredRichTextString("Overview label"),
  overviewTitle: requiredRichTextString("Overview title"),
  overviewBody: requiredRichTextString("Overview body"),
  overviewPrimaryCtaText: requiredTrimmedString(
    "Overview primary CTA text",
    100,
  ),
  overviewPrimaryCtaHref: requiredTrimmedString(
    "Overview primary CTA link",
    500,
  ),
  overviewSecondaryCtaText: requiredTrimmedString(
    "Overview secondary CTA text",
    100,
  ),
  overviewSecondaryCtaHref: requiredTrimmedString(
    "Overview secondary CTA link",
    500,
  ),
  overviewBenefitsLabel: requiredRichTextString("Overview benefits label"),
  overviewBenefit1: requiredRichTextString("Overview benefit 1"),
  overviewBenefit2: requiredRichTextString("Overview benefit 2"),
  overviewBenefit3: requiredRichTextString("Overview benefit 3"),
  overviewBenefit4: requiredRichTextString("Overview benefit 4"),
  processLabel: requiredRichTextString("Process label"),
  processTitle: requiredRichTextString("Process title"),
  processBody: requiredRichTextString("Process body"),
  processStep1Title: requiredRichTextString("Process step 1 title"),
  processStep1Body: requiredRichTextString("Process step 1 body"),
  processStep2Title: requiredRichTextString("Process step 2 title"),
  processStep2Body: requiredRichTextString("Process step 2 body"),
  processStep3Title: requiredRichTextString("Process step 3 title"),
  processStep3Body: requiredRichTextString("Process step 3 body"),
  processStep4Title: requiredRichTextString("Process step 4 title"),
  processStep4Body: requiredRichTextString("Process step 4 body"),
  templatesLabel: requiredRichTextString("Templates label"),
  templatesTitle: requiredRichTextString("Templates title"),
  templatesBody: requiredRichTextString("Templates body"),
});

export type WeBrandSchoolsPageContentInput = z.infer<
  typeof weBrandSchoolsPageContentSchema
>;

export const schoolWebsiteTestimonialSchema = z.object({
  schoolName: requiredTrimmedString(
    "School name",
    SCHOOL_WEBSITE_TESTIMONIAL_MAX_SCHOOL_NAME_CHARACTERS,
  ),
  logoPublicId: optionalCloudinaryPublicIdSchema,
  quote: requiredTrimmedString(
    "Testimonial write-up",
    SCHOOL_WEBSITE_TESTIMONIAL_MAX_CHARACTERS,
  ),
  authorName: requiredTrimmedString(
    "Contact name",
    SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_NAME_CHARACTERS,
  ),
  authorPosition: requiredTrimmedString(
    "Position in school",
    SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_POSITION_CHARACTERS,
  ),
  isVisible: z.boolean(),
  position: z.number().int().min(0, "Position must be zero or greater"),
});

export type SchoolWebsiteTestimonialInput = z.infer<
  typeof schoolWebsiteTestimonialSchema
>;

const referralExpirySchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  },
  z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Expiration date must be a valid date",
    })
    .refine((value) => new Date(value).getTime() > Date.now(), {
      message: "Expiration date must be in the future",
    })
    .nullable()
    .optional(),
);

export const referralLinkSchema = z.object({
  displayName: requiredTrimmedString("Name or organization name", 160),
  slug: z
    .string()
    .trim()
    .min(1, "Referral slug is required")
    .max(80, "Referral slug must be 80 characters or less")
    .regex(
      /^[a-z0-9]+$/,
      "Referral slug must use lowercase letters and numbers only",
    ),
  email: z
    .string()
    .trim()
    .min(1, "Referral owner email is required")
    .max(254, "Referral owner email must be 254 characters or less")
    .email("Enter a valid referral owner email"),
  location: optionalTrimmedString("State/city or location", 160),
  expiresAt: referralExpirySchema,
  status: z.enum(["ACTIVE", "INACTIVE"]),
  notificationEnabled: z.boolean(),
});

export type ReferralLinkInput = z.infer<typeof referralLinkSchema>;

export const schoolWebsiteTemplateAssetSchema = z
  .object({
    id: z
      .string()
      .trim()
      .max(100, "Asset ID must be 100 characters or less")
      .optional()
      .nullable(),
    publicId: z
      .string()
      .trim()
      .min(1, "Asset public ID is required")
      .max(500, "Asset public ID must be 500 characters or less"),
    mediaType: mediaTypeSchema,
    thumbnailPublicId: optionalCloudinaryPublicIdSchema,
    caption: optionalTrimmedString("Asset caption", 300),
    position: z.number().int().min(0, "Position must be zero or greater"),
  })
  .refine(
    (value) => value.mediaType !== "VIDEO" || Boolean(value.thumbnailPublicId),
    {
      message: "Video assets require a thumbnail image",
      path: ["thumbnailPublicId"],
    },
  );

export const schoolWebsiteTemplateSchema = z.object({
  name: requiredTrimmedString("Template name", 160),
  slug: z
    .string()
    .trim()
    .min(1, "Template slug is required")
    .max(250, "Template slug must be 250 characters or less")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Template slug must be lowercase letters, numbers, and hyphens only",
    ),
  summary: requiredTrimmedString("Template summary", 220),
  description: optionalTrimmedString("Template description", 3000),
  websiteUrl: optionalUrlSchema,
  highlights: jsonStringArrayUpToSchema("Template highlights", 8, 120),
  coverAssetId: z
    .string()
    .trim()
    .max(100, "Cover asset ID must be 100 characters or less")
    .optional()
    .nullable(),
  assets: z.array(schoolWebsiteTemplateAssetSchema).default([]),
  isVisible: z.boolean(),
  position: z.number().int().min(0, "Position must be zero or greater"),
});

export type SchoolWebsiteTemplateInput = z.infer<
  typeof schoolWebsiteTemplateSchema
>;

export const schoolPortalSectionContentSchema = z.object({
  eyebrow: requiredTrimmedString("Portal section eyebrow", 120),
  title: requiredTrimmedString("Portal section title", 260),
  description: requiredTrimmedString("Portal section description", 1600),
  ctaText: optionalTrimmedString("Portal CTA text", 100),
  ctaHref: optionalTrimmedString("Portal CTA link", 500),
  isVisible: z.boolean(),
});

export type SchoolPortalSectionContentInput = z.infer<
  typeof schoolPortalSectionContentSchema
>;

export const schoolPortalFeatureAssetSchema = z
  .object({
    id: z
      .string()
      .trim()
      .max(100, "Asset ID must be 100 characters or less")
      .optional()
      .nullable(),
    publicId: z
      .string()
      .trim()
      .min(1, "Asset public ID is required")
      .max(500, "Asset public ID must be 500 characters or less"),
    mediaType: mediaTypeSchema,
    thumbnailPublicId: optionalCloudinaryPublicIdSchema,
    caption: optionalTrimmedString("Asset caption", 300),
    position: z.number().int().min(0, "Position must be zero or greater"),
  })
  .refine(
    (value) => value.mediaType !== "VIDEO" || Boolean(value.thumbnailPublicId),
    {
      message: "Video assets require a thumbnail image",
      path: ["thumbnailPublicId"],
    },
  );

export const schoolPortalFeatureCardSchema = z.object({
  title: requiredTrimmedString("Portal card title", 160),
  summary: requiredTrimmedString("Portal card summary", 260),
  description: requiredTrimmedString("Portal card description", 4000),
  features: jsonStringArrayUpToSchema("Portal card features", 12, 140),
  coverAssetId: z
    .string()
    .trim()
    .max(100, "Cover asset ID must be 100 characters or less")
    .optional()
    .nullable(),
  youtubeUrl: optionalYoutubeUrlSchema,
  assets: z.array(schoolPortalFeatureAssetSchema).default([]),
  isVisible: z.boolean(),
  position: z.number().int().min(0, "Position must be zero or greater"),
});

export type SchoolPortalFeatureCardInput = z.infer<
  typeof schoolPortalFeatureCardSchema
>;

export const schoolWebsiteApplicationStepOneSchema = z.object({
  templateId: z
    .string()
    .trim()
    .max(100, "Template ID must be 100 characters or less")
    .optional()
    .nullable(),
  selectedTemplateName: requiredTrimmedString("Selected template", 160),
  schoolName: requiredTrimmedString("School name", 180),
  aboutSchool: requiredTrimmedString("About your school", 5000),
  vision: requiredTrimmedString("Vision", 2000),
  mission: requiredTrimmedString("Mission", 2000),
  coreValues: requiredTrimmedString("Core values", 2000),
  officialPhone: requiredTrimmedString("Official phone", 60),
  officialEmail: requiredTrimmedString("Official email", 320).refine(
    (value) => z.string().email().safeParse(value).success,
    "Please enter a valid official email address",
  ),
  officialAddress: requiredTrimmedString("Official address", 300),
  officialWebsiteUrl: optionalUrlSchema,
  officialContactName: optionalTrimmedString("Official contact name", 120),
  officialContactRole: optionalTrimmedString("Official contact role", 120),
  officialContactPhone: optionalTrimmedString("Official contact phone", 60),
  officialContactEmail: z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }, z.string().email("Please enter a valid official contact email").max(320).nullable().optional()),
});

export const schoolWebsiteApplicationStepTwoSchema = z
  .object({
    domainChoice: schoolWebsiteDomainChoiceSchema,
    existingDomain: optionalTrimmedString("Existing domain", 255),
    preferredDomain1: optionalTrimmedString("Preferred domain name", 255),
    preferredDomain2: optionalTrimmedString(
      "Second preferred domain name",
      255,
    ),
  })
  .refine(
    (value) =>
      value.domainChoice !== "HAS_DOMAIN" || Boolean(value.existingDomain),
    {
      message: "Existing domain is required when the school already has one",
      path: ["existingDomain"],
    },
  )
  .refine(
    (value) =>
      value.domainChoice !== "NEEDS_DOMAIN" || Boolean(value.preferredDomain1),
    {
      message:
        "Preferred domain name is required when the school needs a domain",
      path: ["preferredDomain1"],
    },
  )
  .refine(
    (value) =>
      value.domainChoice !== "NEEDS_DOMAIN" || Boolean(value.preferredDomain2),
    {
      message:
        "Second preferred domain name is required when the school needs a domain",
      path: ["preferredDomain2"],
    },
  );

export const schoolWebsiteApplicationSchema =
  schoolWebsiteApplicationStepOneSchema
    .merge(schoolWebsiteApplicationStepTwoSchema)
    .extend({
      status: schoolWebsiteJobStatusSchema.default("PENDING"),
      adminNotes: optionalTrimmedString("Admin notes", 4000),
      hp_school_website: z.string().optional(),
      _form_ts: z.union([z.number(), z.string()]).optional(),
    });

export type SchoolWebsiteApplicationInput = z.infer<
  typeof schoolWebsiteApplicationSchema
>;

export const schoolWebsiteApplicationStatusSchema = z.object({
  status: schoolWebsiteJobStatusSchema,
  adminNotes: optionalTrimmedString("Admin notes", 4000),
  goLiveDetails: z
    .object({
      websiteUrl: requiredUrlSchema("Website URL"),
      portalUrl: requiredUrlSchema("Portal URL"),
      portalPassword: requiredTrimmedString("Portal password", 500),
      adminMessage: optionalTrimmedString("Admin message", 1000),
    })
    .optional(),
});

export type SchoolWebsiteApplicationStatusInput = z.infer<
  typeof schoolWebsiteApplicationStatusSchema
>;
