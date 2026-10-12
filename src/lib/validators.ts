import { z } from "zod";

const heroCardObjectPositionSchema = z.enum([
  "center",
  "top",
  "bottom",
  "left",
  "right",
]);

const optionalCloudinaryPublicIdSchema = z
  .string()
  .trim()
  .max(500, "Image public ID must be 500 characters or less")
  .optional()
  .nullable();

const hexColorSchema = z
  .string()
  .trim()
  .regex(
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    "Enter a valid hex color like #000c99",
  );

const optionalHexColorSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, hexColorSchema.nullable().optional());

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

const optionalSlugSchema = z
  .string()
  .trim()
  .max(250, "Slug must be 250 characters or less")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase letters, numbers, and hyphens only",
  )
  .optional()
  .nullable()
  .or(z.literal(""));

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

function requiredHeroRichText(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long`);
}

function jsonStringArraySchema(
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
            parsed.length > 0 &&
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
        message: `${label} must be a JSON array of 1 to ${maxItems} non-empty strings`,
      },
    );
}

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

export const composeEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Email body is required").max(10000),
  recipientFilter: z.enum(["all", "filtered"]),
  roleFilter: z.string().optional(),
  eventFilter: z.string().optional(),
  statusFilter: z.string().optional(),
});

export type ComposeEmailData = z.infer<typeof composeEmailSchema>;

export type ContactFormState = {
  success?: boolean;
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
};

// ─── Event Management ────────────────────────────────────────────────────────

export const eventFormFieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["TEXT", "EMAIL", "SELECT", "TEXTAREA", "URL", "CHECKBOX"]),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.string().optional(), // JSON array string for SELECT
  position: z.number().int().min(0),
});

export type EventFormFieldData = z.infer<typeof eventFormFieldSchema>;

export const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(250)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    ),
  description: z.string().min(1, "Description is required").max(5000),
  dateTime: z.string().min(1, "Date and time is required"),
  timezone: z.string().min(1, "Timezone is required"),
  location: z.string().min(1, "Location is required").max(300),
  imagePublicId: z.string().optional(),
  attendeeLimit: z.number().int().positive().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]),
  formFields: z.array(eventFormFieldSchema),
});

export type EventFormData = z.infer<typeof eventFormSchema>;

// ─── Hero Management ─────────────────────────────────────────────────────────

export const heroContentSchema = z.object({
  backgroundImagePublicId: optionalCloudinaryPublicIdSchema,
  cardFallbackImagePublicId: optionalCloudinaryPublicIdSchema,
  eyebrow: requiredHeroRichText("Eyebrow", 12000),
  headline: requiredHeroRichText("Headline", 20000),
  body: requiredHeroRichText("Body text", 20000),
  ctaText: requiredTrimmedString("CTA text", 100),
  ctaHref: requiredTrimmedString("CTA link", 500),
  stackBadge: requiredHeroRichText("Stack badge", 12000),
  stackTitle: requiredHeroRichText("Stack title", 20000),
  stackBody: requiredHeroRichText("Stack body", 20000),
  stackCtaText: requiredTrimmedString("Stack CTA text", 100),
  stackCtaHref: requiredTrimmedString("Stack CTA link", 500),
});

export type HeroContentInput = z.infer<typeof heroContentSchema>;

export const heroCardSchema = z.object({
  href: requiredTrimmedString("Link", 500),
  imagePublicId: optionalCloudinaryPublicIdSchema,
  objectPosition: heroCardObjectPositionSchema,
  label: requiredTrimmedString("Label", 50),
  title: requiredTrimmedString("Title", 100),
  chip: requiredTrimmedString("Chip text", 100),
  badge: requiredTrimmedString("Badge", 3),
  metaTitle: requiredTrimmedString("Meta title", 100),
  metaSubtitle: requiredTrimmedString("Meta subtitle", 200),
  isVisible: z.boolean(),
});

export type HeroCardInput = z.infer<typeof heroCardSchema>;

// ─── Portfolio & Services ─────────────────────────────────────────────────────

const serviceTypeSchema = z.enum(["DESIGN", "BUILD", "PRINT"]);
const mediaTypeSchema = z.enum(["IMAGE", "VIDEO"]);

export const serviceContentSchema = z.object({
  title: requiredTrimmedString("Title", 100),
  description: requiredTrimmedString("Description", 1000),
  iconPublicId: optionalCloudinaryPublicIdSchema,
  cardColor: hexColorSchema.optional(),
  overlayColor: hexColorSchema.optional(),
  backgroundImagePublicId: optionalCloudinaryPublicIdSchema,
});

export type ServiceContentInput = z.infer<typeof serviceContentSchema>;

export const projectSectionBackgroundSchema = z.object({
  backgroundImagePublicId: optionalCloudinaryPublicIdSchema,
});

export type ProjectSectionBackgroundInput = z.infer<
  typeof projectSectionBackgroundSchema
>;

export const projectsHeroContentSchema = z.object({
  eyebrow: requiredTrimmedString("Eyebrow", 120),
  headline: requiredTrimmedString("Headline", 220),
  body: requiredTrimmedString("Body", 2000),
  backgroundImagePublicId: optionalCloudinaryPublicIdSchema,
  ctaText: requiredTrimmedString("CTA text", 100),
  ctaHref: requiredTrimmedString("CTA link", 500),
  ctaSectionLabel: requiredTrimmedString("Section label", 120),
  ctaSectionHeadline: requiredTrimmedString("Section headline", 300),
  ctaSectionBody: requiredTrimmedString("Section body", 2000),
  cta2Text: requiredTrimmedString("Second CTA text", 100),
  cta2Href: requiredTrimmedString("Second CTA link", 500),
});

export type ProjectsHeroContentInput = z.infer<
  typeof projectsHeroContentSchema
>;

export const portfolioTabContentSchema = z.object({
  portfolioEyebrow: z
    .string()
    .trim()
    .max(300, "Eyebrow must be 300 characters or less"),
  portfolioDescription: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or less"),
});

export type PortfolioTabContentInput = z.infer<
  typeof portfolioTabContentSchema
>;

export const portfolioAssetSchema = z
  .object({
    publicId: z
      .string()
      .trim()
      .min(1, "Asset public ID is required")
      .max(500, "Asset public ID must be 500 characters or less"),
    mediaType: mediaTypeSchema,
    thumbnailPublicId: optionalCloudinaryPublicIdSchema,
    caption: z
      .string()
      .trim()
      .max(300, "Caption must be 300 characters or less")
      .optional()
      .nullable(),
    position: z.number().int().min(0),
  })
  .refine(
    (value) => value.mediaType !== "VIDEO" || Boolean(value.thumbnailPublicId),
    {
      message: "Video assets require a thumbnail image",
      path: ["thumbnailPublicId"],
    },
  );

export type PortfolioAssetInput = z.infer<typeof portfolioAssetSchema>;

export const portfolioItemSchema = z
  .object({
    serviceType: serviceTypeSchema,
    title: requiredTrimmedString("Title", 200),
    clientName: z
      .string()
      .trim()
      .max(120, "Client name must be 120 characters or less")
      .optional()
      .nullable(),
    slug: optionalSlugSchema,
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or less")
      .optional()
      .nullable(),
    tags: z.string().default("[]"), // JSON array string
    websiteUrl: optionalUrlSchema,
    objectPosition: z
      .string()
      .trim()
      .max(100, "Object position must be 100 characters or less")
      .optional()
      .or(z.literal("")),
    mediaPublicId: z
      .string()
      .trim()
      .min(1, "Media is required")
      .max(500, "Media public ID must be 500 characters or less"),
    mediaType: mediaTypeSchema,
    thumbnailPublicId: optionalCloudinaryPublicIdSchema,
    coverAssetId: z
      .string()
      .trim()
      .max(100, "Cover asset ID must be 100 characters or less")
      .optional()
      .nullable(),
    assets: z.array(portfolioAssetSchema).default([]),
    isFeatured: z.boolean(),
    isVisible: z.boolean(),
  })
  .refine(
    (value) => value.mediaType !== "VIDEO" || Boolean(value.thumbnailPublicId),
    {
      message: "Video projects require a thumbnail image",
      path: ["thumbnailPublicId"],
    },
  );

export type PortfolioItemInput = z.infer<typeof portfolioItemSchema>;

// ─── Expressions Section ─────────────────────────────────────────────────────

export const expressionSchema = z.object({
  name: requiredTrimmedString("Name", 100),
  logoPublicId: optionalCloudinaryPublicIdSchema,
  description: requiredTrimmedString("Description", 1000),
  websiteUrl: z
    .string()
    .trim()
    .min(1, "Website URL is required")
    .max(500, "Website URL must be 500 characters or less")
    .url("Please enter a valid URL"),
  isVisible: z.boolean(),
});

export type ExpressionInput = z.infer<typeof expressionSchema>;

// ─── Manifesto Section ────────────────────────────────────────────────────────

export const manifestoSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Manifesto text is required")
    .max(500, "Manifesto text must be 500 characters or less"),
});

export type ManifestoInput = z.infer<typeof manifestoSchema>;

// Dynamic registration validator factory — builds a Zod schema at runtime
// from the EventFormField definitions for a specific event.
export function createRegistrationValidator(
  fields: { name: string; type: string; required: boolean }[],
) {
  const shape: Record<string, z.ZodTypeAny> = {
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
  };

  for (const field of fields) {
    // Skip name/email as they're always included above
    if (field.name === "name" || field.name === "email") continue;

    let validator: z.ZodTypeAny;

    switch (field.type) {
      case "EMAIL":
        validator = z.string().email("Please enter a valid email");
        break;
      case "URL":
        validator = z
          .string()
          .url("Please enter a valid URL")
          .or(z.literal(""));
        break;
      case "CHECKBOX":
        validator = z.boolean();
        break;
      default:
        validator = z.string();
    }

    if (!field.required && field.type !== "CHECKBOX") {
      validator = validator.optional().or(z.literal(""));
    } else if (field.required && field.type !== "CHECKBOX") {
      validator = z.string().min(1, `${field.name} is required`);
      if (field.type === "EMAIL") {
        validator = z.string().email("Please enter a valid email");
      } else if (field.type === "URL") {
        validator = z.string().url("Please enter a valid URL");
      }
    }

    shape[field.name] = validator;
  }

  return z.object(shape);
}

// ─── Offers Page ──────────────────────────────────────────────────────────────

const audienceTypeSchema = z.enum([
  "FOR_YOU",
  "BUSINESS",
  "SCHOOLS",
  "CHURCHES",
]);
const audienceColorSchema = z.enum(["cyan", "blue", "purple", "green"]);
const billingDurationSchema = z.enum([
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
]);
const contactSocialPlatformSchema = z.enum([
  "LINKEDIN",
  "INSTAGRAM",
  "X",
  "FACEBOOK",
  "WHATSAPP",
  "YOUTUBE",
  "TIKTOK",
]);
const schoolWebsiteJobStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "LIVE",
  "DECLINED",
]);
const schoolWebsiteDomainChoiceSchema = z.enum(["HAS_DOMAIN", "NEEDS_DOMAIN"]);
const aboutIconKeySchema = z.enum([
  "ZAP",
  "GLOBE",
  "SPARKLES",
  "TRENDING_UP",
  "TARGET",
  "LIGHTBULB",
  "HEART_HANDSHAKE",
  "SHIELD",
]);

export const offersPageContentSchema = z.object({
  // Hero
  heroEyebrow: requiredRichTextString("Hero eyebrow"),
  heroHeadline: requiredRichTextString("Hero headline"),
  heroBody: requiredRichTextString("Hero body"),
  heroBgImagePublicId: optionalCloudinaryPublicIdSchema,
  heroCtaText: requiredTrimmedString("Hero CTA text", 100),
  heroCtaHref: requiredTrimmedString("Hero CTA link", 500),
  // Services section
  servicesSectionLabel: requiredTrimmedString("Services label", 120),
  servicesSectionTitle: requiredTrimmedString("Services title", 220),
  servicesSectionBody: requiredTrimmedString("Services body", 2000),
  // Audience section
  audienceSectionLabel: requiredTrimmedString("Audience label", 120),
  audienceSectionTitle: requiredTrimmedString("Audience title", 220),
  audienceSectionBody: requiredTrimmedString("Audience body", 2000),
  // Offer card UI copy
  popularBadgeText: requiredTrimmedString("Popular badge text", 80),
  featuresLabel: requiredTrimmedString("Features label", 80),
  choosePlanText: requiredTrimmedString("Choose offer text", 80),
  requestQuoteText: requiredTrimmedString("Request quote text", 80),
  // Bottom CTA
  ctaLabel: requiredTrimmedString("CTA label", 120),
  ctaTitle: requiredTrimmedString("CTA title", 220),
  ctaBody: requiredTrimmedString("CTA body", 2000),
  cta1Text: requiredTrimmedString("CTA 1 text", 100),
  cta1Href: requiredTrimmedString("CTA 1 link", 500),
  cta2Text: requiredTrimmedString("CTA 2 text", 100),
  cta2Href: requiredTrimmedString("CTA 2 link", 500),
});

export type OffersPageContentInput = z.infer<typeof offersPageContentSchema>;

export const audienceSchema = z.object({
  type: audienceTypeSchema,
  tabLabel: requiredTrimmedString("Tab label", 80),
  emptyTitle: requiredTrimmedString("Empty title", 120),
  emptyBody: requiredTrimmedString("Empty body", 500),
  color: audienceColorSchema,
  isVisible: z.boolean(),
});

export type AudienceInput = z.infer<typeof audienceSchema>;

export const offerGroupSchema = z.object({
  name: requiredTrimmedString("Name", 100),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .nullable(),
  isVisible: z.boolean(),
});

export type OfferGroupInput = z.infer<typeof offerGroupSchema>;

export const pricingPlanSchema = z.object({
  name: requiredTrimmedString("Name", 100),
  subtitle: z
    .string()
    .trim()
    .max(300, "Subtitle must be 300 characters or less")
    .optional()
    .nullable(),
  imagePublicId: optionalCloudinaryPublicIdSchema,
  features: jsonStringArraySchema("Features", 20, 200),
  billingEnabled: z.boolean(),
  isHighlighted: z.boolean(),
  highlightBgColor: optionalHexColorSchema,
  highlightTextColor: optionalHexColorSchema,
  isVisible: z.boolean(),
});

export type PricingPlanInput = z.infer<typeof pricingPlanSchema>;

export const planBillingOptionSchema = z.object({
  duration: billingDurationSchema,
  priceNGN: z.number().positive("Price must be positive").optional().nullable(),
  priceUSD: z.number().positive("Price must be positive").optional().nullable(),
  label: z
    .string()
    .trim()
    .max(80, "Label must be 80 characters or less")
    .optional()
    .nullable(),
  isDefault: z.boolean(),
});

export type PlanBillingOptionInput = z.infer<typeof planBillingOptionSchema>;

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

export type SchoolWebsiteTemplateAssetInput = z.infer<
  typeof schoolWebsiteTemplateAssetSchema
>;

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

export type SchoolPortalFeatureAssetInput = z.infer<
  typeof schoolPortalFeatureAssetSchema
>;

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

export type SchoolWebsiteApplicationStepOneInput = z.infer<
  typeof schoolWebsiteApplicationStepOneSchema
>;

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

export type SchoolWebsiteApplicationStepTwoInput = z.infer<
  typeof schoolWebsiteApplicationStepTwoSchema
>;

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

// ─── Contact Page ─────────────────────────────────────────────────────────────

function lineListSchema(
  label: string,
  maxItems: number,
  maxItemLength: number,
) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => {
      const items = value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);

      return (
        items.length > 0 &&
        items.length <= maxItems &&
        items.every((item) => item.length <= maxItemLength)
      );
    }, `${label} must contain between 1 and ${maxItems} items`)
    .refine((value) => {
      const items = value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);

      return new Set(items).size === items.length;
    }, `${label} cannot contain duplicate values`);
}

export const contactPageContentSchema = z.object({
  homeEyebrow: requiredTrimmedString("Home section eyebrow", 120),
  homeTitle: requiredTrimmedString("Home section title", 160),
  homeBody: requiredTrimmedString("Home section body", 600),
  homeCtaText: requiredTrimmedString("Home CTA text", 100),
  homeCtaHref: requiredTrimmedString("Home CTA link", 500),
  heroEyebrow: requiredTrimmedString("Hero eyebrow", 120),
  heroTitle: requiredTrimmedString("Hero title", 160),
  heroBody: requiredTrimmedString("Hero body", 600),
  infoEyebrow: requiredTrimmedString("Info eyebrow", 120),
  infoTitle: requiredTrimmedString("Info title", 160),
  infoBody: requiredTrimmedString("Info body", 600),
  formEyebrow: requiredTrimmedString("Form eyebrow", 120),
  formTitle: requiredTrimmedString("Form title", 160),
  formBody: requiredTrimmedString("Form body", 600),
  addressLabel: requiredTrimmedString("Address label", 80),
  address: requiredTrimmedString("Address", 300),
  emailLabel: requiredTrimmedString("Email label", 80),
  emailsText: lineListSchema("Emails", 5, 120).refine(
    (value) =>
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .every((item) => z.string().email().safeParse(item).success),
    "Enter one valid email address per line",
  ),
  phoneLabel: requiredTrimmedString("Phone label", 80),
  phonesText: lineListSchema("Phones", 5, 60),
  socialsLabel: requiredTrimmedString("Socials label", 80),
});

export const contactSocialLinkSchema = z.object({
  platform: contactSocialPlatformSchema,
  label: requiredTrimmedString("Social label", 80),
  href: requiredTrimmedString("Social link", 500).refine(
    (value) => z.string().url().safeParse(value).success,
    "Please enter a valid URL",
  ),
});

export type ContactPageContentInput = z.infer<typeof contactPageContentSchema>;
export type ContactSocialLinkInput = z.infer<typeof contactSocialLinkSchema>;

export const contactReplySchema = z.object({
  subject: requiredTrimmedString("Reply subject", 160),
  body: requiredTrimmedString("Reply message", 4000),
});

export type ContactReplyInput = z.infer<typeof contactReplySchema>;

// ─── About Page ───────────────────────────────────────────────────────────────

export const aboutPageContentSchema = z.object({
  heroEyebrow: requiredTrimmedString("Hero eyebrow", 120),
  heroHeadline: requiredTrimmedString("Hero headline", 220),
  heroBody: requiredTrimmedString("Hero body", 2500),
  heroBackgroundImagePublicId: optionalCloudinaryPublicIdSchema,
  heroPrimaryCtaText: requiredTrimmedString("Primary CTA text", 100),
  heroPrimaryCtaHref: requiredTrimmedString("Primary CTA link", 500),
  heroSecondaryCtaText: requiredTrimmedString("Secondary CTA text", 100),
  heroSecondaryCtaHref: requiredTrimmedString("Secondary CTA link", 500),
  heroStat1Value: requiredTrimmedString("Stat 1 value", 40),
  heroStat1Label: requiredTrimmedString("Stat 1 label", 120),
  heroStat2Value: requiredTrimmedString("Stat 2 value", 40),
  heroStat2Label: requiredTrimmedString("Stat 2 label", 120),
  heroStat3Value: requiredTrimmedString("Stat 3 value", 40),
  heroStat3Label: requiredTrimmedString("Stat 3 label", 120),
  heroStat4Value: requiredTrimmedString("Stat 4 value", 40),
  heroStat4Label: requiredTrimmedString("Stat 4 label", 120),
  storyLabel: requiredTrimmedString("Story label", 120),
  storyTitle: requiredTrimmedString("Story title", 220),
  storyBody1: requiredTrimmedString("Story body paragraph 1", 2500),
  storyBody2: requiredTrimmedString("Story body paragraph 2", 2500),
  storyHighlightLabel: requiredTrimmedString("Story highlight label", 120),
  storyHighlightTitle: requiredTrimmedString("Story highlight title", 160),
  storyHighlightBody: requiredTrimmedString("Story highlight body", 800),
  storyTrustedLabel: requiredTrimmedString("Story trusted label", 120),
  storyTrustedItems: jsonStringArraySchema("Trusted items", 8, 80),
  expertiseLabel: requiredTrimmedString("Expertise label", 120),
  expertiseTitle: requiredTrimmedString("Expertise title", 220),
  expertiseBody: requiredTrimmedString("Expertise body", 2000),
  teamLabel: requiredTrimmedString("Team label", 120),
  teamTitle: requiredTrimmedString("Team title", 220),
  teamBody: requiredTrimmedString("Team body", 2000),
  cultureTitle: requiredTrimmedString("Culture title", 160),
  cultureBody: requiredTrimmedString("Culture body", 1500),
  teamNoteLabel: requiredTrimmedString("Team note label", 120),
  teamPortfolioButtonText: requiredTrimmedString("Portfolio button text", 120),
  spaceLabel: requiredTrimmedString("Space label", 120),
  spaceTitle: requiredTrimmedString("Space title", 220),
  spaceBody: requiredTrimmedString("Space body", 2000),
  valuesLabel: requiredTrimmedString("Values label", 120),
  valuesTitle: requiredTrimmedString("Values title", 220),
  valuesBody: requiredTrimmedString("Values body", 2000),
  ctaLabel: requiredTrimmedString("CTA label", 160),
  ctaTitle: requiredTrimmedString("CTA title", 220),
  ctaBody: requiredTrimmedString("CTA body", 2000),
  ctaText: requiredTrimmedString("CTA text", 100),
  ctaHref: requiredTrimmedString("CTA link", 500),
});

export type AboutPageContentInput = z.infer<typeof aboutPageContentSchema>;

export const aboutMilestoneSchema = z.object({
  year: requiredTrimmedString("Year", 40),
  title: requiredTrimmedString("Title", 120),
  description: requiredTrimmedString("Description", 500),
  isVisible: z.boolean(),
  position: z.number().int().min(0, "Position must be zero or greater"),
});

export type AboutMilestoneInput = z.infer<typeof aboutMilestoneSchema>;

export const aboutExpertiseItemSchema = z.object({
  icon: aboutIconKeySchema,
  title: requiredTrimmedString("Title", 120),
  description: requiredTrimmedString("Description", 600),
  metricLabel: requiredTrimmedString("Metric label", 80),
  metricValue: requiredTrimmedString("Metric value", 80),
  isVisible: z.boolean(),
  position: z.number().int().min(0, "Position must be zero or greater"),
});

export type AboutExpertiseItemInput = z.infer<typeof aboutExpertiseItemSchema>;

export const aboutTeamMemberSchema = z.object({
  name: requiredTrimmedString("Name", 120),
  role: requiredTrimmedString("Role", 120),
  bio: requiredTrimmedString("Bio", 900),
  expertise: jsonStringArraySchema("Expertise tags", 8, 60),
  funFact: requiredTrimmedString("Professional note", 240),
  portfolioUrl: z
    .string()
    .trim()
    .min(1, "Portfolio link is required")
    .max(500, "Portfolio link must be 500 characters or less")
    .url("Please enter a valid URL"),
  showPortfolioButton: z.boolean(),
  imagePublicId: optionalCloudinaryPublicIdSchema,
  isVisible: z.boolean(),
  position: z.number().int().min(0, "Position must be zero or greater"),
});

export type AboutTeamMemberInput = z.infer<typeof aboutTeamMemberSchema>;

export const aboutSpaceItemSchema = z
  .object({
    title: requiredTrimmedString("Title", 120),
    description: requiredTrimmedString("Description", 600),
    mediaType: mediaTypeSchema,
    mediaPublicId: optionalCloudinaryPublicIdSchema,
    thumbnailPublicId: optionalCloudinaryPublicIdSchema,
    isVisible: z.boolean(),
    position: z.number().int().min(0, "Position must be zero or greater"),
  })
  .refine(
    (value) => value.mediaType !== "VIDEO" || Boolean(value.mediaPublicId),
    {
      message: "Video spaces require a video upload",
      path: ["mediaPublicId"],
    },
  )
  .refine(
    (value) => value.mediaType !== "VIDEO" || Boolean(value.thumbnailPublicId),
    {
      message: "Video spaces require a thumbnail image",
      path: ["thumbnailPublicId"],
    },
  );

export type AboutSpaceItemInput = z.infer<typeof aboutSpaceItemSchema>;

export const aboutValueItemSchema = z.object({
  icon: aboutIconKeySchema,
  title: requiredTrimmedString("Title", 120),
  description: requiredTrimmedString("Description", 500),
  isVisible: z.boolean(),
  position: z.number().int().min(0, "Position must be zero or greater"),
});

export type AboutValueItemInput = z.infer<typeof aboutValueItemSchema>;
