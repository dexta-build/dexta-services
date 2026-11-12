"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { createElement } from "react";
import { sendTemplate } from "@/lib/email";
import {
  ReferralUsedEmail,
  SchoolApplicationReceivedEmail,
} from "@/emails/schools";
import { verifyRecaptcha } from "@/lib/recaptcha";
import {
  rateLimit,
  RATE_LIMITS,
  getClientIp,
  formatRateLimitWaitTime,
} from "@/lib/rate-limit";
import {
  recordSpamAlert,
  shouldSendNotification,
} from "@/lib/notification-throttle";
import {
  schoolWebsiteApplicationSchema,
  type SchoolWebsiteApplicationInput,
} from "@/lib/validators";
import { SCHOOL_WEBSITE_APPLICATIONS_TAG } from "@/lib/we-brand-schools-cache";
import {
  isReferralUsable,
  WE_BRAND_SCHOOLS_REFERRAL_COOKIE,
} from "@/lib/we-brand-schools-referrals";
import { weBrandSchoolsPrisma } from "@/lib/we-brand-schools-prisma";

export type SchoolWebsiteApplicationActionResult = {
  success: boolean;
  message: string;
};

const templateSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const formatSubmitted = (value: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(value);

type HeadersLike = {
  get(name: string): string | null;
};

function getPublicOrigin(headersList: HeadersLike) {
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const protocol =
    headersList.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  return `${protocol}://${host}`;
}

function getUniqueEmailRecipients(
  recipients: Array<{ email?: string | null; name?: string | null }>,
) {
  const seen = new Set<string>();

  return recipients
    .map((recipient) => ({
      email: recipient.email?.trim() ?? "",
      name: recipient.name?.trim() || undefined,
    }))
    .filter((recipient) => {
      if (!recipient.email) return false;
      const key = recipient.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function getUsableReferralFromCookie() {
  const cookieStore = await cookies();
  const referralCode = cookieStore
    .get(WE_BRAND_SCHOOLS_REFERRAL_COOKIE)
    ?.value.trim();

  if (!referralCode) return null;

  const referral = await weBrandSchoolsPrisma.referralLink.findUnique({
    where: { code: referralCode },
    select: {
      id: true,
      code: true,
      slug: true,
      displayName: true,
      email: true,
      location: true,
      notificationEnabled: true,
      status: true,
      deletedAt: true,
      expiresAt: true,
    },
  });

  if (!referral || !isReferralUsable(referral)) return null;

  return referral;
}

async function logReferralNotification({
  referralLinkId,
  applicationId,
  recipientEmail,
  subject,
  status,
  errorMessage,
  sentAt,
}: {
  referralLinkId: string;
  applicationId: string;
  recipientEmail: string;
  subject: string;
  status: "SENT" | "FAILED" | "SKIPPED";
  errorMessage?: string | null;
  sentAt?: Date | null;
}) {
  try {
    await weBrandSchoolsPrisma.referralNotificationLog.create({
      data: {
        referralLinkId,
        applicationId,
        type: "APPLICATION_SUBMITTED",
        recipientEmail,
        subject,
        status,
        errorMessage: errorMessage ?? null,
        sentAt: sentAt ?? null,
      },
    });
  } catch (error) {
    console.error("[Referral Notification Log Failed]", error);
  }
}

async function notifyReferralOwnerApplicationSubmitted({
  referral,
  applicationId,
  schoolName,
  selectedTemplateName,
  submittedAt,
  referralUrl,
}: {
  referral: NonNullable<
    Awaited<ReturnType<typeof getUsableReferralFromCookie>>
  >;
  applicationId: string;
  schoolName: string;
  selectedTemplateName: string;
  submittedAt: Date;
  referralUrl: string;
}) {
  const subject = `A school used your referral link — ${schoolName}`;

  if (!referral.notificationEnabled || !referral.email) {
    await logReferralNotification({
      referralLinkId: referral.id,
      applicationId,
      recipientEmail: referral.email || "unknown",
      subject,
      status: "SKIPPED",
      errorMessage: referral.notificationEnabled
        ? "Referral owner email is missing."
        : "Referral notifications are disabled.",
    });
    return;
  }

  if (!shouldSendNotification(`referral:${referral.id}`, 30_000, 10)) {
    console.warn(
      `[Referral Notification Throttled] Suppressed duplicate email to ${referral.email}`,
    );
    await logReferralNotification({
      referralLinkId: referral.id,
      applicationId,
      recipientEmail: referral.email,
      subject,
      status: "SKIPPED",
      errorMessage: "Notification rate limit throttled to prevent flooding.",
    });
    return;
  }

  try {
    await sendTemplate({
      to: {
        email: referral.email,
        name: referral.displayName,
      },
      subject,
      email: createElement(ReferralUsedEmail, {
        name: referral.displayName,
        schoolName,
        templateName: selectedTemplateName,
        submitted: formatSubmitted(submittedAt),
        referralUrl,
      }),
    });

    await logReferralNotification({
      referralLinkId: referral.id,
      applicationId,
      recipientEmail: referral.email,
      subject,
      status: "SENT",
      sentAt: new Date(),
    });
  } catch (error) {
    console.error("[Referral Owner Email Failed]", error);
    await logReferralNotification({
      referralLinkId: referral.id,
      applicationId,
      recipientEmail: referral.email,
      subject,
      status: "FAILED",
      errorMessage:
        error instanceof Error ? error.message : "Unknown email failure.",
    });
  }
}

async function notifySchoolApplicationSubmitted({
  schoolName,
  selectedTemplateName,
  submittedAt,
  recipients,
}: {
  schoolName: string;
  selectedTemplateName: string;
  submittedAt: Date;
  recipients: Array<{ email?: string | null; name?: string | null }>;
}) {
  const uniqueRecipients = getUniqueEmailRecipients(recipients);
  const subject = `We received your school website request — ${schoolName}`;

  for (const recipient of uniqueRecipients) {
    try {
      await sendTemplate({
        to: recipient,
        subject,
        email: createElement(SchoolApplicationReceivedEmail, {
          schoolName,
          templateName: selectedTemplateName,
          submitted: formatSubmitted(submittedAt),
        }),
      });
    } catch (error) {
      console.error("[School Application Confirmation Email Failed]", {
        email: recipient.email,
        error,
      });
    }
  }
}

export async function recordSchoolWebsiteTemplateSelection(
  templateSlug: string,
): Promise<SchoolWebsiteApplicationActionResult> {
  try {
    const normalizedTemplateSlug = templateSlug.trim().toLowerCase();

    if (
      !normalizedTemplateSlug ||
      normalizedTemplateSlug.length > 250 ||
      !templateSlugPattern.test(normalizedTemplateSlug)
    ) {
      return {
        success: false,
        message: "Invalid template selection.",
      };
    }

    const referral = await getUsableReferralFromCookie();
    if (!referral) {
      return {
        success: true,
        message: "No active referral attribution found.",
      };
    }

    await weBrandSchoolsPrisma.referralEvent.create({
      data: {
        referralLinkId: referral.id,
        eventType: "TEMPLATE_SELECTED",
        templateSlug: normalizedTemplateSlug,
        metadata: {
          referralCode: referral.code,
        },
      },
    });

    return {
      success: true,
      message: "Template selection tracked.",
    };
  } catch (error) {
    console.error("[Record School Website Template Selection]", error);
    return {
      success: false,
      message: "Failed to track template selection.",
    };
  }
}

export async function submitSchoolWebsiteApplication(
  data: SchoolWebsiteApplicationInput,
  recaptchaToken?: string,
): Promise<SchoolWebsiteApplicationActionResult> {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);

    // 1. Honeypot check: Bots auto-fill all form fields including hidden traps
    const honeypot = data.hp_school_website;
    if (typeof honeypot === "string" && honeypot.trim().length > 0) {
      recordSpamAlert({
        formName: "we-brand-schools",
        reason: "honeypot",
        ip,
        details: { trapValue: honeypot },
      });
      return {
        success: true,
        message:
          "Application submitted successfully! Our team will review your application.",
      };
    }

    // 2. Timing check: Headless bots submit instantaneously (< 1500ms)
    const formTsRaw = data._form_ts;
    if (formTsRaw) {
      const elapsed = Date.now() - Number(formTsRaw);
      if (!Number.isNaN(elapsed) && elapsed > 0 && elapsed < 1500) {
        recordSpamAlert({
          formName: "we-brand-schools",
          reason: "timing",
          ip,
          details: { elapsedMs: elapsed },
        });
        return {
          success: true,
          message:
            "Application submitted successfully! Our team will review your application.",
        };
      }
    }

    const limit = rateLimit(
      `school-website-application:${ip}`,
      RATE_LIMITS.form,
    );
    if (!limit.success) {
      recordSpamAlert({
        formName: "we-brand-schools",
        reason: "rate_limit",
        ip,
        details: { resetMs: limit.resetMs },
      });
      const waitTime = formatRateLimitWaitTime(limit.resetMs);
      return {
        success: false,
        message: `Too many submissions. Please wait ${waitTime} before trying again.`,
      };
    }

    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(
        recaptchaToken,
        "school_website_application",
      );

      if (!recaptchaResult.success) {
        recordSpamAlert({
          formName: "we-brand-schools",
          reason: "recaptcha",
          ip,
        });
        return {
          success: false,
          message: "reCAPTCHA verification failed. Please try again.",
        };
      }
    }

    const parsed = schoolWebsiteApplicationSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message:
          parsed.error.issues[0]?.message ??
          "Validation failed. Please check your submission.",
      };
    }

    const payload = parsed.data;
    const referral = await getUsableReferralFromCookie();
    const selectedTemplate = payload.templateId
      ? await prisma.schoolWebsiteTemplate.findUnique({
          where: { id: payload.templateId },
          select: { slug: true },
        })
      : null;

    const application =
      await weBrandSchoolsPrisma.schoolWebsiteApplication.create({
        data: {
          templateId: payload.templateId ?? null,
          referralLinkId: referral?.id ?? null,
          referralCodeSnapshot: referral?.code ?? null,
          referralNameSnapshot: referral?.displayName ?? null,
          referralSlugSnapshot: referral?.slug ?? null,
          referralEmailSnapshot: referral?.email ?? null,
          referralLocationSnapshot: referral?.location ?? null,
          selectedTemplateName: payload.selectedTemplateName,
          schoolName: payload.schoolName,
          aboutSchool: payload.aboutSchool,
          vision: payload.vision,
          mission: payload.mission,
          coreValues: payload.coreValues,
          officialPhone: payload.officialPhone,
          officialEmail: payload.officialEmail,
          officialAddress: payload.officialAddress,
          officialWebsiteUrl: payload.officialWebsiteUrl || null,
          officialContactName: payload.officialContactName || null,
          officialContactRole: payload.officialContactRole || null,
          officialContactPhone: payload.officialContactPhone || null,
          officialContactEmail: payload.officialContactEmail || null,
          domainChoice: payload.domainChoice,
          existingDomain: payload.existingDomain || null,
          preferredDomain1: payload.preferredDomain1 || null,
          preferredDomain2: payload.preferredDomain2 || null,
          status: "PENDING",
          adminNotes: null,
        },
      });

    if (referral) {
      await weBrandSchoolsPrisma.referralEvent.create({
        data: {
          referralLinkId: referral.id,
          eventType: "APPLICATION_SUBMITTED",
          templateSlug: selectedTemplate?.slug ?? null,
          applicationId: application.id,
          metadata: {
            referralCode: referral.code,
            schoolName: payload.schoolName,
            selectedTemplateName: payload.selectedTemplateName,
          },
        },
      });

      const origin = getPublicOrigin(headersList);
      const referralUrl = origin
        ? `${origin}/webrandschools/r/${referral.slug}`
        : `/webrandschools/r/${referral.slug}`;

      await notifyReferralOwnerApplicationSubmitted({
        referral,
        applicationId: application.id,
        schoolName: payload.schoolName,
        selectedTemplateName: payload.selectedTemplateName,
        submittedAt: application.createdAt,
        referralUrl,
      });
    }

    await notifySchoolApplicationSubmitted({
      schoolName: payload.schoolName,
      selectedTemplateName: payload.selectedTemplateName,
      submittedAt: application.createdAt,
      recipients: [
        {
          email: payload.officialEmail,
          name: payload.schoolName,
        },
        {
          email: payload.officialContactEmail,
          name: payload.officialContactName,
        },
      ],
    });

    updateTag(SCHOOL_WEBSITE_APPLICATIONS_TAG);
    revalidatePath("/webrandschools");
    revalidatePath("/admin");

    return {
      success: true,
      message:
        "Your school website request has been received. Our team will review it and get in touch.",
    };
  } catch (error) {
    console.error("[Submit School Website Application]", error);

    return {
      success: false,
      message: "Something went wrong. Please try again later.",
    };
  }
}
