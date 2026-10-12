"use server";

import { type Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { get as httpGet, type IncomingMessage } from "node:http";
import { get as httpsGet } from "node:https";
import path from "node:path";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { getCloudinaryPublicId } from "@/lib/cloudinary";
import { uploadRawBufferToCloudinary } from "@/lib/cloudinary-server";
import { buildRegularEmailHtml, sendEmail } from "@/lib/email";
import { buildSchoolWebsiteProjectExportZip } from "@/lib/school-template-exporter";
import { getSchoolWebsiteProjectPreviewHref } from "@/lib/school-template-preview-links";
import {
  applySchoolNameFallbackToProjectContent,
  buildSchoolTemplateProjectContent,
  buildSchoolTemplateSourceSnapshot,
  isSchoolTemplateSourceSnapshot,
  parseSchoolTemplateProjectContent,
  resolveSchoolTemplateManifestForSelection,
  sanitizeSchoolTemplateProjectContent,
  syncSchoolTemplateProjectContentWithManifest,
  validateSchoolTemplateProjectContentReferences,
  type SchoolTemplateProjectContent,
  type SchoolTemplateSourceSnapshot,
} from "@/lib/school-template-project-content";
import {
  createSchoolWebsiteTestimonialRecord,
  deleteSchoolWebsiteTestimonialRecord,
  deleteSchoolWebsiteTestimonialsRecord,
  listSchoolWebsiteTestimonials,
  updateSchoolWebsiteTestimonialRecord,
  weBrandSchoolsPrisma,
} from "@/lib/we-brand-schools-prisma";
import {
  SCHOOL_PORTAL_CARDS_TAG,
  SCHOOL_PORTAL_SECTION_TAG,
  SCHOOL_WEBSITE_TESTIMONIALS_TAG,
  SCHOOL_WEBSITE_APPLICATIONS_TAG,
  SCHOOL_WEBSITE_REFERRALS_TAG,
  SCHOOL_WEBSITE_TEMPLATES_TAG,
  WE_BRAND_SCHOOLS_CONTENT_TAG,
} from "@/lib/we-brand-schools-cache";
import {
  SCHOOL_PORTAL_SECTION_CONTENT_DEFAULTS,
  WE_BRAND_SCHOOLS_PAGE_CONTENT_DEFAULTS,
  parseJsonStringArray,
  serializeJsonStringArray,
  type SchoolPortalFeatureCardData,
  type SchoolPortalSectionContentData,
  type SchoolWebsiteApplicationData,
  type SchoolWebsiteTestimonialData,
  type SchoolWebsiteTemplateData,
  type WeBrandSchoolsPageContentData,
  withSchoolPortalSectionContentDefaults,
  withWeBrandSchoolsPageContentDefaults,
} from "@/lib/we-brand-schools-defaults";
import { sanitizeWeBrandSchoolsPageContentInput } from "@/lib/we-brand-schools-rich-text.server";
import {
  schoolPortalFeatureCardSchema,
  schoolPortalSectionContentSchema,
  referralLinkSchema,
  schoolWebsiteApplicationStatusSchema,
  schoolWebsiteTestimonialSchema,
  schoolWebsiteTemplateSchema,
  weBrandSchoolsPageContentSchema,
  type SchoolPortalFeatureCardInput,
  type SchoolPortalSectionContentInput,
  type ReferralLinkInput,
  type SchoolWebsiteApplicationStatusInput,
  type SchoolWebsiteTestimonialInput,
  type SchoolWebsiteTemplateInput,
  type WeBrandSchoolsPageContentInput,
} from "@/lib/validators";

type ActionResult = { success: boolean; message: string };
type StartSchoolWebsiteProjectResult = ActionResult & {
  projectId?: string;
  redirectHref?: string;
};
type SaveSchoolWebsiteProjectOptions = {
  createRevision?: boolean;
  note?: string;
  applicationId?: string;
};
type SaveSchoolWebsiteProjectDraftResult = ActionResult & {
  updatedAt?: string;
};
type GenerateSchoolWebsiteProjectPreviewLinkResult = ActionResult & {
  previewHref?: string;
};
type ExportSchoolWebsiteProjectResult = ActionResult & {
  exportZipUrl?: string;
  lastExportedAt?: string;
  status?: SchoolWebsiteProjectStatusRow;
  fileCount?: number;
  pageCount?: number;
};
type ResetSchoolWebsiteProjectResult = ActionResult & {
  contentJson?: SchoolTemplateProjectContent;
  updatedAt?: string;
  status?: SchoolWebsiteProjectStatusRow;
};
type ExtractedCopySuggestion = {
  fieldKey: string;
  label: string;
  value: string;
};
type ExtractSchoolWebsiteCopySuggestionsResult = ActionResult & {
  suggestions?: ExtractedCopySuggestion[];
};
type SchoolWebsiteProjectExportLogDelegate = {
  create(args: {
    data: {
      projectId: string;
      status: "STARTED" | "SUCCESS" | "FAILED";
      message: string;
      exportZipUrl: string | null;
      fileCount: number | null;
      pageCount: number | null;
      durationMs: number | null;
      detailsJson?: Record<string, unknown>;
    };
  }): Promise<unknown>;
};
type ReferralGoLiveApplication = {
  id: string;
  schoolName: string;
  selectedTemplateName: string;
  status: SchoolWebsiteApplicationRow["status"];
  referralLinkId: string | null;
  referralCodeSnapshot: string | null;
  referralNameSnapshot: string | null;
  referralSlugSnapshot: string | null;
  referralEmailSnapshot: string | null;
  officialEmail: string;
  officialContactName: string | null;
  officialContactEmail: string | null;
  existingDomain: string | null;
  preferredDomain1: string | null;
  officialWebsiteUrl: string | null;
  project: {
    id: string;
    schoolName: string;
    templateName: string;
    exportZipUrl: string | null;
  } | null;
  referralLink: {
    id: string;
    code: string;
    slug: string;
    displayName: string;
    email: string;
    notificationEnabled: boolean;
  } | null;
  referralNotificationLogs: {
    id: string;
  }[];
};
type GoLiveEmailDetails = NonNullable<
  SchoolWebsiteApplicationStatusInput["goLiveDetails"]
>;
type SchoolPortalFeatureCardTransactionClient = {
  schoolPortalFeatureCard: {
    update(args: unknown): Promise<unknown>;
  };
  schoolPortalFeatureAsset: {
    deleteMany(args: unknown): Promise<unknown>;
  };
};
type SchoolWebsiteProjectRevisionResult = ActionResult & {
  revisionId?: string;
};
type SchoolWebsiteProjectEditorDataResult = ActionResult & {
  project?: {
    id: string;
    applicationId: string;
    schoolName: string;
    templateSlug: string;
    status: SchoolWebsiteProjectStatusRow;
    contentJson: SchoolTemplateProjectContent;
    sourceSnapshot: SchoolTemplateSourceSnapshot;
    exportZipUrl: string | null;
    lastExportedAt: Date | null;
    updatedAt: Date;
  };
};
type SchoolWebsiteProjectAdminQueryRow = {
  id: string;
  applicationId: string;
  schoolName: string;
  templateName: string;
  templateSlug: string;
  contactEmail: string | null;
  status: SchoolWebsiteProjectStatusRow;
  contentJson: unknown;
  exportZipUrl: string | null;
  lastExportedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
type SchoolWebsiteProjectStatusRow =
  | "DRAFT"
  | "IN_PROGRESS"
  | "READY_FOR_EXPORT"
  | "EXPORTED"
  | "LIVE";
type ReferralLinkStatusRow = "ACTIVE" | "INACTIVE";
type ReferralEventTypeRow =
  | "VISIT"
  | "TEMPLATE_SELECTED"
  | "APPLICATION_SUBMITTED"
  | "SITE_LIVE";
type ReferralNotificationStatusRow = "SENT" | "FAILED" | "SKIPPED";

export type WeBrandSchoolsPageContentRow = WeBrandSchoolsPageContentData;
export type SchoolWebsiteTestimonialRow = SchoolWebsiteTestimonialData;
export type SchoolWebsiteTemplateRow = SchoolWebsiteTemplateData;
export type SchoolPortalSectionContentRow = SchoolPortalSectionContentData;
export type SchoolPortalFeatureCardRow = SchoolPortalFeatureCardData;
export type ReferralLinkRow = {
  id: string;
  code: string;
  slug: string;
  displayName: string;
  email: string;
  location: string | null;
  expiresAt: Date | null;
  status: ReferralLinkStatusRow;
  notificationEnabled: boolean;
  createdByAdminId: string | null;
  createdByAdmin: {
    id: string;
    name: string;
    email: string;
  } | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  applicationCount: number;
  visitCount: number;
  templateSelectionCount: number;
  liveSiteCount: number;
  conversionRate: number | null;
  lastActivityAt: Date | null;
  latestNotificationStatus: ReferralNotificationStatusRow | null;
  latestNotificationAt: Date | null;
};
type ReferralLinkQueryRow = Omit<
  ReferralLinkRow,
  | "applicationCount"
  | "visitCount"
  | "templateSelectionCount"
  | "liveSiteCount"
  | "conversionRate"
  | "lastActivityAt"
  | "latestNotificationStatus"
  | "latestNotificationAt"
> & {
  _count: {
    applications: number;
  };
  events: Array<{
    eventType: ReferralEventTypeRow;
    createdAt: Date;
  }>;
  applications: Array<{
    status: SchoolWebsiteApplicationRow["status"];
    templateId: string | null;
    selectedTemplateName: string;
  }>;
  notificationLogs: Array<{
    status: ReferralNotificationStatusRow;
    createdAt: Date;
    sentAt: Date | null;
  }>;
};
export type SchoolWebsiteApplicationRow = SchoolWebsiteApplicationData & {
  id: string;
  referralLinkId: string | null;
  referralCodeSnapshot: string | null;
  referralNameSnapshot: string | null;
  referralSlugSnapshot: string | null;
  referralEmailSnapshot: string | null;
  referralLocationSnapshot: string | null;
  createdAt: Date;
  updatedAt: Date;
  template: {
    id: string;
    name: string;
  } | null;
  referralLink: {
    id: string;
    code: string;
    slug: string;
    displayName: string;
    email: string;
    location: string | null;
    status: ReferralLinkStatusRow;
    expiresAt: Date | null;
    deletedAt: Date | null;
  } | null;
  project: {
    id: string;
    status: SchoolWebsiteProjectStatusRow;
  } | null;
};
export type SchoolWebsiteProjectRow = {
  id: string;
  applicationId: string;
  schoolName: string;
  templateName: string;
  templateSlug: string;
  contactEmail: string | null;
  status: SchoolWebsiteProjectStatusRow;
  previewPageSlug: string;
  exportZipUrl: string | null;
  lastExportedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function revalidateWeBrandSchoolsAdmin() {
  updateTag(WE_BRAND_SCHOOLS_CONTENT_TAG);
  updateTag(SCHOOL_PORTAL_SECTION_TAG);
  updateTag(SCHOOL_PORTAL_CARDS_TAG);
  updateTag(SCHOOL_WEBSITE_TESTIMONIALS_TAG);
  updateTag(SCHOOL_WEBSITE_TEMPLATES_TAG);
  updateTag(SCHOOL_WEBSITE_APPLICATIONS_TAG);
  updateTag(SCHOOL_WEBSITE_REFERRALS_TAG);
  revalidatePath("/webrandschools");
  revalidatePath("/admin/we-brand-schools");
  revalidatePath("/admin/we-brand-schools/content");
  revalidatePath("/admin/we-brand-schools/testimonials");
  revalidatePath("/admin/we-brand-schools/templates");
  revalidatePath("/admin/we-brand-schools/portal");
  revalidatePath("/admin/we-brand-schools/applications");
  revalidatePath("/admin/we-brand-schools/referrals");
  revalidatePath("/admin/we-brand-schools/projects");
}

function getSchoolWebsiteProjectEditorHref(projectId: string) {
  return `/admin/we-brand-schools/projects/${projectId}/editor`;
}

function slugifyExportFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "school-website"
  );
}

function isCloudinaryFileSizeLimitError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const uploadError = error as {
    message?: unknown;
    http_code?: unknown;
  };

  return (
    uploadError.http_code === 400 &&
    String(uploadError.message ?? "")
      .toLowerCase()
      .includes("file size too large")
  );
}

async function writeExportZipToPublic({
  projectId,
  fileName,
  buffer,
}: {
  projectId: string;
  fileName: string;
  buffer: Buffer;
}) {
  const exportDirectory = path.join(
    process.cwd(),
    "public",
    "school-website-exports",
    projectId,
  );
  await mkdir(exportDirectory, { recursive: true });

  const filePath = path.join(exportDirectory, fileName);
  await writeFile(filePath, buffer);

  return `/school-website-exports/${encodeURIComponent(projectId)}/${encodeURIComponent(fileName)}`;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function getContentValidationMessage(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}) {
  const issue = error.issues[0];
  if (!issue) {
    return "Project content is not in the expected JSON format.";
  }

  const path = issue.path.length
    ? ` at ${issue.path.map(String).join(".")}`
    : "";
  return `Project content is invalid${path}: ${issue.message}`;
}

async function createSchoolWebsiteProjectRevisionRecord({
  projectId,
  contentJson,
  note,
}: {
  projectId: string;
  contentJson: SchoolTemplateProjectContent;
  note?: string;
}) {
  return weBrandSchoolsPrisma.schoolWebsiteProjectRevision.create({
    data: {
      projectId,
      contentJson,
      note: note ?? null,
    },
    select: {
      id: true,
    },
  });
}

async function requireAuth() {
  return requireAdminSession();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNotificationDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function normalizePublicUrlCandidate(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    if (!trimmed.includes(".") || /\s/.test(trimmed)) return null;
    return `https://${trimmed.replace(/^\/+/, "")}`;
  }
}

const DEFAULT_GO_LIVE_ADMIN_MESSAGE =
  "Please change your portal password after your first login.";

function getApplicationLiveUrl(
  application: ReferralGoLiveApplication,
  websiteUrl?: string | null,
) {
  return (
    normalizePublicUrlCandidate(websiteUrl) ??
    normalizePublicUrlCandidate(application.existingDomain) ??
    normalizePublicUrlCandidate(application.preferredDomain1) ??
    normalizePublicUrlCandidate(application.officialWebsiteUrl)
  );
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

async function logReferralSiteLiveNotification({
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
        type: "SITE_LIVE",
        recipientEmail,
        subject,
        status,
        errorMessage: errorMessage ?? null,
        sentAt: sentAt ?? null,
      },
    });
  } catch (error) {
    console.error("[Referral Site Live Notification Log Failed]", error);
  }
}

async function recordReferralSiteLiveEvent({
  application,
  liveUrl,
  wentLiveAt,
}: {
  application: ReferralGoLiveApplication;
  liveUrl: string | null;
  wentLiveAt: Date;
}) {
  if (!application.referralLinkId) return;

  try {
    const existingEvent = await weBrandSchoolsPrisma.referralEvent.findFirst({
      where: {
        referralLinkId: application.referralLinkId,
        applicationId: application.id,
        eventType: "SITE_LIVE",
      },
      select: { id: true },
    });

    if (existingEvent) return;

    await weBrandSchoolsPrisma.referralEvent.create({
      data: {
        referralLinkId: application.referralLinkId,
        eventType: "SITE_LIVE",
        applicationId: application.id,
        metadata: {
          referralCode:
            application.referralCodeSnapshot ?? application.referralLink?.code,
          schoolName: application.schoolName,
          selectedTemplateName: application.selectedTemplateName,
          projectId: application.project?.id ?? null,
          projectName:
            application.project?.schoolName ?? application.schoolName,
          liveUrl,
          wentLiveAt: wentLiveAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("[Referral Site Live Event Failed]", error);
  }
}

async function notifySchoolContactsSiteLive(
  application: ReferralGoLiveApplication,
  goLiveDetails: GoLiveEmailDetails,
) {
  const wentLiveAt = new Date();
  const liveUrl = getApplicationLiveUrl(application, goLiveDetails.websiteUrl);
  const projectName = application.project?.schoolName ?? application.schoolName;
  const projectTemplate =
    application.project?.templateName ?? application.selectedTemplateName;
  const liveUrlMarkup = liveUrl
    ? `<a href="${escapeHtml(liveUrl)}">${escapeHtml(liveUrl)}</a>`
    : "Not available";
  const portalUrlMarkup = `<a href="${escapeHtml(goLiveDetails.portalUrl)}">${escapeHtml(goLiveDetails.portalUrl)}</a>`;
  const adminMessage =
    goLiveDetails.adminMessage ?? DEFAULT_GO_LIVE_ADMIN_MESSAGE;
  const subject = `Your school website is now live — ${application.schoolName}`;
  const recipients = getUniqueEmailRecipients([
    {
      email: application.officialEmail,
      name: application.schoolName,
    },
    {
      email: application.officialContactEmail,
      name: application.officialContactName,
    },
  ]);

  for (const recipient of recipients) {
    try {
      await sendEmail({
        to: recipient,
        subject,
        htmlContent: buildRegularEmailHtml({
          heading: "Your school website is now live",
          body: `
            <p style="margin:0 0 16px;">Hello,</p>
            <p style="margin:0 0 16px;">Good news. Your We Brand Schools website has been marked live by the Dexta team.</p>
            <p style="margin:0 0 8px;"><strong>School/person:</strong> ${escapeHtml(application.schoolName)}</p>
            <p style="margin:0 0 8px;"><strong>Website/project:</strong> ${escapeHtml(projectName)}</p>
            <p style="margin:0 0 8px;"><strong>Template:</strong> ${escapeHtml(projectTemplate)}</p>
            <p style="margin:0 0 8px;"><strong>Live URL:</strong> ${liveUrlMarkup}</p>
            <p style="margin:0 0 8px;"><strong>Portal URL:</strong> ${portalUrlMarkup}</p>
            <p style="margin:0 0 8px;"><strong>Portal password:</strong> ${escapeHtml(goLiveDetails.portalPassword)}</p>
            <p style="margin:0 0 16px;"><strong>Go-live date:</strong> ${escapeHtml(formatNotificationDate(wentLiveAt))}</p>
            <p style="margin:0 0 16px;">${escapeHtml(adminMessage)}</p>
            <p style="margin:0;">Thank you for working with Dexta. You can reply to this email if you need support or corrections.</p>`,
        }),
      });
    } catch (error) {
      console.error("[School Site Live Email Failed]", {
        email: recipient.email,
        error,
      });
    }
  }
}

async function notifyReferralOwnerSiteLive(
  application: ReferralGoLiveApplication,
  websiteUrl?: string | null,
) {
  if (!application.referralLinkId) return;

  const wentLiveAt = new Date();
  const liveUrl = getApplicationLiveUrl(application, websiteUrl);

  await recordReferralSiteLiveEvent({
    application,
    liveUrl,
    wentLiveAt,
  });

  if (application.referralNotificationLogs.length > 0) return;

  const referral = application.referralLink;
  const recipientEmail =
    referral?.email ?? application.referralEmailSnapshot ?? "";
  const referralName =
    application.referralNameSnapshot ?? referral?.displayName ?? "Referral";
  const subject = `${application.schoolName} is now live`;

  if (!referral) {
    await logReferralSiteLiveNotification({
      referralLinkId: application.referralLinkId,
      applicationId: application.id,
      recipientEmail: recipientEmail || "unknown",
      subject,
      status: "SKIPPED",
      errorMessage: "Referral link record is no longer available.",
    });
    return;
  }

  if (!referral.notificationEnabled || !recipientEmail) {
    await logReferralSiteLiveNotification({
      referralLinkId: referral.id,
      applicationId: application.id,
      recipientEmail: recipientEmail || "unknown",
      subject,
      status: "SKIPPED",
      errorMessage: referral.notificationEnabled
        ? "Referral owner email is missing."
        : "Referral notifications are disabled.",
    });
    return;
  }

  const projectName = application.project?.schoolName ?? application.schoolName;
  const projectTemplate =
    application.project?.templateName ?? application.selectedTemplateName;
  const liveUrlMarkup = liveUrl
    ? `<a href="${escapeHtml(liveUrl)}">${escapeHtml(liveUrl)}</a>`
    : "Not available";

  try {
    await sendEmail({
      to: {
        email: recipientEmail,
        name: referralName,
      },
      subject,
      htmlContent: buildRegularEmailHtml({
        heading: "A referred school website is now live",
        body: `
          <p style="margin:0 0 16px;">Hello ${escapeHtml(referralName)},</p>
          <p style="margin:0 0 16px;">The school/person who used your referral link now has their We Brand Schools site marked live.</p>
          <p style="margin:0 0 8px;"><strong>School/person:</strong> ${escapeHtml(application.schoolName)}</p>
          <p style="margin:0 0 8px;"><strong>Website/project:</strong> ${escapeHtml(projectName)}</p>
          <p style="margin:0 0 8px;"><strong>Template:</strong> ${escapeHtml(projectTemplate)}</p>
          <p style="margin:0 0 8px;"><strong>Live URL:</strong> ${liveUrlMarkup}</p>
          <p style="margin:0 0 8px;"><strong>Go-live date:</strong> ${escapeHtml(formatNotificationDate(wentLiveAt))}</p>
          <p style="margin:0 0 16px;"><strong>Referral:</strong> ${escapeHtml(referralName)} (${escapeHtml(`/webrandschools/r/${application.referralSlugSnapshot ?? referral.slug}`)})</p>
          <p style="margin:0;">Thank you for connecting this school with Dexta. This go-live has been recorded under your referral link.</p>`,
      }),
    });

    await logReferralSiteLiveNotification({
      referralLinkId: referral.id,
      applicationId: application.id,
      recipientEmail,
      subject,
      status: "SENT",
      sentAt: new Date(),
    });
  } catch (error) {
    console.error("[Referral Site Live Email Failed]", error);
    await logReferralSiteLiveNotification({
      referralLinkId: referral.id,
      applicationId: application.id,
      recipientEmail,
      subject,
      status: "FAILED",
      errorMessage:
        error instanceof Error ? error.message : "Unknown email failure.",
    });
  }
}

function getSafeProjectContent({
  contentJson,
  sourceSnapshot,
  templateSlug,
}: {
  contentJson: unknown;
  sourceSnapshot: unknown;
  templateSlug?: string | null;
}) {
  const parsedContent = parseSchoolTemplateProjectContent(contentJson);
  if (!parsedContent.success) {
    return {
      success: false as const,
      message: getContentValidationMessage(parsedContent.error),
    };
  }

  if (!isSchoolTemplateSourceSnapshot(sourceSnapshot)) {
    return {
      success: false as const,
      message: "Project source snapshot is not in the expected format.",
    };
  }

  const syncedProjectContent = syncSchoolTemplateProjectContentWithManifest({
    content: parsedContent.data,
    sourceSnapshot,
    rawContent: contentJson,
    templateSlug,
  });

  const sanitizedContent = sanitizeSchoolTemplateProjectContent(
    syncedProjectContent.contentJson,
    syncedProjectContent.sourceSnapshot,
  );
  const referenceIssues = validateSchoolTemplateProjectContentReferences(
    sanitizedContent,
    syncedProjectContent.sourceSnapshot,
  );

  if (referenceIssues.length > 0) {
    return {
      success: false as const,
      message: referenceIssues[0],
    };
  }

  return {
    success: true as const,
    contentJson: sanitizedContent,
    sourceSnapshot: syncedProjectContent.sourceSnapshot,
  };
}

function normalizeImportUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function readImportResponseBody(response: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: string[] = [];
    let receivedLength = 0;
    const maxLength = 2_000_000;

    response.setEncoding("utf8");
    response.on("data", (chunk: string) => {
      receivedLength += chunk.length;
      if (receivedLength > maxLength) {
        response.destroy(new Error("That page is too large to import."));
        return;
      }
      chunks.push(chunk);
    });
    response.on("end", () => resolve(chunks.join("")));
    response.on("error", reject);
  });
}

async function requestImportedHtml(
  url: URL,
  redirectCount = 0,
): Promise<{
  ok: boolean;
  status: number;
  contentType: string;
  html: string;
}> {
  if (redirectCount > 5) {
    throw new Error("That URL redirected too many times.");
  }

  return new Promise((resolve, reject) => {
    const requestHeaders = {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "DextaSchoolWebsiteImporter/1.0",
    };
    const handleResponse = (response: IncomingMessage) => {
      const status = response.statusCode ?? 0;
      const location = response.headers.location;

      if (status >= 300 && status < 400 && location) {
        response.resume();
        let nextUrl: URL;
        try {
          nextUrl = new URL(location, url);
        } catch {
          reject(new Error("That URL redirected to an invalid location."));
          return;
        }

        if (nextUrl.protocol !== "http:" && nextUrl.protocol !== "https:") {
          reject(new Error("That URL redirected to an unsupported protocol."));
          return;
        }

        requestImportedHtml(nextUrl, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      readImportResponseBody(response)
        .then((html) =>
          resolve({
            ok: status >= 200 && status < 300,
            status,
            contentType: String(response.headers["content-type"] ?? ""),
            html,
          }),
        )
        .catch(reject);
    };
    const request =
      url.protocol === "https:"
        ? httpsGet(
            url,
            {
              headers: requestHeaders,
              rejectUnauthorized: false,
              timeout: 15_000,
            },
            handleResponse,
          )
        : httpGet(
            url,
            {
              headers: requestHeaders,
              timeout: 15_000,
            },
            handleResponse,
          );

    request.on("timeout", () => {
      request.destroy(new Error("That URL took too long to respond."));
    });
    request.on("error", reject);
  });
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&mdash;|&ndash;/gi, "-");
}

function htmlToPlainText(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function extractFirstMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ? htmlToPlainText(match[1]) : "";
}

function uniqueTextChunks(values: string[]) {
  const seen = new Set<string>();

  return values
    .map((value) => htmlToPlainText(value))
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter((value) => value.length >= 3)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function getTextTokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2),
  );
}

function normalizeCopyMemoryText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSimilarToUsedCopy(value: string, used: Set<string>) {
  const normalizedValue = normalizeCopyMemoryText(value);
  if (!normalizedValue) return true;
  if (used.has(normalizedValue)) return true;

  const valueTokens = getTextTokens(normalizedValue);
  if (valueTokens.size < 4) return false;

  for (const usedValue of used) {
    const usedTokens = getTextTokens(usedValue);
    if (usedTokens.size < 4) continue;

    let shared = 0;
    valueTokens.forEach((token) => {
      if (usedTokens.has(token)) shared += 1;
    });

    const overlap = shared / Math.min(valueTokens.size, usedTokens.size);
    if (overlap >= 0.68) {
      return true;
    }
  }

  return false;
}

function isProtectedCopyImportField(fieldKey: string, label: string) {
  return /eyebrow|eye\s*brow|kicker|label|category/.test(
    `${fieldKey} ${label}`.toLowerCase(),
  );
}

function scoreTextMatch(value: string, query: string) {
  const valueTokens = getTextTokens(value);
  const queryTokens = getTextTokens(query);
  let score = 0;

  queryTokens.forEach((token) => {
    if (valueTokens.has(token)) {
      score += 1;
    }
  });

  return score;
}

function splitSentences(value: string) {
  return (value.match(/[^.!?]+[.!?]?/g) ?? [value])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function fitCopyToTargetLength({
  value,
  candidates,
  targetLength,
  type,
}: {
  value: string;
  candidates: string[];
  targetLength: number;
  type: string;
}) {
  const normalizedValue = value.replace(/\s+/g, " ").trim();
  if (!normalizedValue) return "";

  const lowerBound = Math.max(18, Math.floor(targetLength * 0.72));
  const upperBound = Math.max(32, Math.ceil(targetLength * 1.24));

  if (type === "text" && normalizedValue.length > upperBound) {
    const sentence =
      splitSentences(normalizedValue).find(
        (item) => item.length <= upperBound && item.length >= lowerBound,
      ) ?? normalizedValue;
    return sentence.length > upperBound
      ? `${sentence.slice(0, Math.max(upperBound - 1, 20)).trim()}...`
      : sentence;
  }

  let output = normalizedValue;
  for (const candidate of candidates) {
    if (output.length >= lowerBound) break;
    const nextSentence = splitSentences(candidate).find(
      (sentence) =>
        !output.toLowerCase().includes(sentence.toLowerCase()) &&
        output.length + sentence.length + 1 <= upperBound,
    );
    if (nextSentence) {
      output = `${output} ${nextSentence}`.trim();
    }
  }

  if (output.length > upperBound) {
    const sentences = splitSentences(output);
    let trimmed = "";
    for (const sentence of sentences) {
      if (`${trimmed} ${sentence}`.trim().length > upperBound) break;
      trimmed = `${trimmed} ${sentence}`.trim();
    }

    return (
      trimmed || `${output.slice(0, Math.max(upperBound - 1, 20)).trim()}...`
    );
  }

  return output;
}

function getImportedTextBuckets(html: string) {
  const title =
    extractFirstMatch(
      html,
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ) ||
    extractFirstMatch(
      html,
      /<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ) ||
    extractFirstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    extractFirstMatch(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ) ||
    extractFirstMatch(
      html,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    );
  const headings = uniqueTextChunks(
    Array.from(html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)).map(
      (match) => match[1],
    ),
  );
  const paragraphs = uniqueTextChunks(
    Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map(
      (match) => match[1],
    ),
  ).filter((value) => value.length >= 24);
  const shortTexts = uniqueTextChunks([
    ...headings,
    ...paragraphs.map((value) => value.split(/[.!?]/)[0] ?? value),
  ]).filter((value) => value.length <= 90);
  const orderedContent = Array.from(
    html.matchAll(/<(h[1-3]|p)[^>]*>([\s\S]*?)<\/\1>/gi),
  )
    .map((match) => ({
      tag: match[1].toLowerCase(),
      text: htmlToPlainText(match[2]),
    }))
    .filter((item) => item.text.length >= 3);
  const sections: Array<{ heading: string; texts: string[] }> = [];
  let currentSection: { heading: string; texts: string[] } | null = null;

  for (const item of orderedContent) {
    if (item.tag.startsWith("h")) {
      currentSection = { heading: item.text, texts: [] };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = { heading: "Overview", texts: [] };
      sections.push(currentSection);
    }
    if (item.text.length >= 24) {
      currentSection.texts.push(item.text);
    }
  }

  return {
    title,
    description,
    headings,
    paragraphs,
    sections,
    shortTexts,
  };
}

function getTargetCopyLength(value: unknown, type: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > 0) {
    return text.length;
  }

  return type === "text" ? 48 : 220;
}

function createFallbackCopy({
  fieldKey,
  label,
  sectionLabel,
  schoolName,
  description,
  type,
}: {
  fieldKey: string;
  label: string;
  sectionLabel: string;
  schoolName: string;
  description: string;
  type: string;
}) {
  const fieldName = `${fieldKey} ${label}`.toLowerCase();
  const name = schoolName || "the school";
  const normalizedSection = sectionLabel.toLowerCase();

  if (/cta|button|link/.test(fieldName)) {
    return /apply|admission/.test(normalizedSection)
      ? "Apply Now"
      : `Discover ${name}`;
  }

  if (/eyebrow|kicker|label|category/.test(fieldName)) {
    return sectionLabel || "Welcome";
  }

  if (/title|headline|heading|name/.test(fieldName)) {
    return sectionLabel ? `${sectionLabel} at ${name}` : name;
  }

  if (/program|academic|curriculum/.test(normalizedSection)) {
    return `${name} offers purposeful learning pathways that help students build knowledge, confidence, and readiness for the future.`;
  }

  if (/admission|apply|enrol|enroll/.test(normalizedSection)) {
    return `${name} makes the admissions journey clear and supportive, helping families take the next step with confidence.`;
  }

  if (/student|life|community|club/.test(normalizedSection)) {
    return `${name} gives students room to belong, lead, explore interests, and grow beyond the classroom.`;
  }

  if (/value|mission|vision|promise/.test(normalizedSection)) {
    return `${name} is guided by strong values, purposeful teaching, and a commitment to developing character as well as achievement.`;
  }

  if (/about|who|legacy|story/.test(normalizedSection)) {
    return `${name} combines academic care, mentoring, and a warm school culture so every learner can grow with confidence.`;
  }

  if (type === "text") {
    return (
      description || `${name} supports learners with purposeful education.`
    );
  }

  return description
    ? `At ${name}, ${description.charAt(0).toLowerCase()}${description.slice(1)}`
    : `${name} provides a thoughtful school experience shaped around learning, character, and growth.`;
}

function pickImportedCopyForField({
  fieldKey,
  label,
  type,
  currentValue,
  sectionLabel,
  buckets,
  used,
}: {
  fieldKey: string;
  label: string;
  type: string;
  currentValue?: unknown;
  sectionLabel: string;
  buckets: ReturnType<typeof getImportedTextBuckets>;
  used: Set<string>;
}) {
  const fieldName = `${fieldKey} ${label}`.toLowerCase();
  const query = `${sectionLabel} ${fieldName}`;
  const schoolName = buckets.title.split(/[|-]/)[0]?.trim() || buckets.title;
  const targetLength = getTargetCopyLength(currentValue, type);
  const relevantSections = [...buckets.sections].sort(
    (left, right) =>
      scoreTextMatch(`${right.heading} ${right.texts.join(" ")}`, query) -
      scoreTextMatch(`${left.heading} ${left.texts.join(" ")}`, query),
  );
  const candidates: string[] = [];
  const relevantSectionTexts = relevantSections.flatMap((section) => [
    section.heading,
    ...section.texts,
  ]);

  if (/eyebrow|kicker|label|category/.test(fieldName)) {
    candidates.push(...relevantSections.map((section) => section.heading));
    candidates.push(...buckets.shortTexts);
  } else if (/title|headline|heading|name/.test(fieldName)) {
    candidates.push(
      ...relevantSections.map((section) => section.heading),
      buckets.title,
      ...buckets.headings,
      ...buckets.shortTexts,
    );
  } else if (
    /body|copy|description|intro|lead|excerpt|bio|quote/.test(fieldName)
  ) {
    candidates.push(
      ...relevantSectionTexts,
      buckets.description,
      ...buckets.paragraphs,
    );
  } else if (/cta|button|link/.test(fieldName)) {
    candidates.push(...buckets.shortTexts);
  } else {
    candidates.push(
      ...(type === "textarea" || type === "richText"
        ? relevantSectionTexts
        : buckets.shortTexts),
    );
  }

  const normalizedCandidates = uniqueTextChunks(candidates);
  const selected =
    normalizedCandidates.find((candidate) => {
      const key = normalizeCopyMemoryText(candidate);
      return key && !isSimilarToUsedCopy(candidate, used);
    }) ??
    createFallbackCopy({
      fieldKey,
      label,
      sectionLabel,
      schoolName,
      description: buckets.description || buckets.paragraphs[0] || "",
      type,
    });

  if (!selected) {
    return "";
  }

  const fittedCopy = fitCopyToTargetLength({
    value: selected,
    candidates: normalizedCandidates,
    targetLength,
    type,
  });
  used.add(normalizeCopyMemoryText(fittedCopy));
  return fittedCopy;
}

async function createSchoolWebsiteProjectExportLog({
  projectId,
  status,
  message,
  exportZipUrl,
  fileCount,
  pageCount,
  durationMs,
  detailsJson,
}: {
  projectId: string;
  status: "STARTED" | "SUCCESS" | "FAILED";
  message: string;
  exportZipUrl?: string | null;
  fileCount?: number;
  pageCount?: number;
  durationMs?: number;
  detailsJson?: Record<string, unknown>;
}) {
  const exportLogDelegate = (
    weBrandSchoolsPrisma as typeof weBrandSchoolsPrisma & {
      schoolWebsiteProjectExportLog?: SchoolWebsiteProjectExportLogDelegate;
    }
  ).schoolWebsiteProjectExportLog;

  if (!exportLogDelegate) {
    return;
  }

  try {
    await exportLogDelegate.create({
      data: {
        projectId,
        status,
        message,
        exportZipUrl: exportZipUrl ?? null,
        fileCount: fileCount ?? null,
        pageCount: pageCount ?? null,
        durationMs: durationMs ?? null,
        detailsJson: detailsJson ?? undefined,
      },
    });
  } catch (error) {
    if (isMissingSchoolWebsiteProjectExportLogTableError(error)) {
      return;
    }

    console.error("[createSchoolWebsiteProjectExportLog]", error);
  }
}

function isMissingSchoolWebsiteProjectExportLogTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const prismaError = error as {
    code?: unknown;
    message?: unknown;
    meta?: {
      table?: unknown;
    };
  };

  return (
    prismaError.code === "P2021" &&
    (String(prismaError.meta?.table ?? "").includes(
      "SchoolWebsiteProjectExportLog",
    ) ||
      String(prismaError.message ?? "").includes(
        "SchoolWebsiteProjectExportLog",
      ))
  );
}

function normalizeContentData(
  data: WeBrandSchoolsPageContentInput,
): WeBrandSchoolsPageContentRow {
  return {
    ...data,
    logoPublicId: data.logoPublicId
      ? (getCloudinaryPublicId(data.logoPublicId) ?? data.logoPublicId)
      : null,
    heroImagePublicId: data.heroImagePublicId
      ? (getCloudinaryPublicId(data.heroImagePublicId) ??
        data.heroImagePublicId)
      : null,
  };
}

function getUnsupportedWeBrandSchoolsContentFields(
  data: WeBrandSchoolsPageContentRow,
): string[] {
  const runtimeDataModel = (
    weBrandSchoolsPrisma as typeof weBrandSchoolsPrisma & {
      _runtimeDataModel?: {
        models?: Record<
          string,
          {
            fields?: Array<{
              name: string;
              kind?: string;
            }>;
          }
        >;
      };
    }
  )._runtimeDataModel;

  const model = runtimeDataModel?.models?.WeBrandSchoolsPageContent;
  if (!model?.fields?.length) {
    return [];
  }

  const supportedFields = new Set(
    model.fields
      .filter((field) => field.kind === "scalar")
      .map((field) => field.name),
  );

  return Object.keys(data).filter((field) => !supportedFields.has(field));
}

function normalizeTemplateData(data: SchoolWebsiteTemplateInput) {
  const normalizeTemplateMediaValue = (value: string) => {
    const trimmedValue = value.trim();

    if (
      trimmedValue.startsWith("/") ||
      trimmedValue.startsWith("http://") ||
      trimmedValue.startsWith("https://")
    ) {
      return trimmedValue;
    }

    return getCloudinaryPublicId(trimmedValue) ?? trimmedValue;
  };

  const assets = data.assets.map((asset, index) => ({
    id: asset.id?.trim() || randomUUID(),
    publicId: normalizeTemplateMediaValue(asset.publicId),
    mediaType: asset.mediaType,
    thumbnailPublicId: asset.thumbnailPublicId
      ? normalizeTemplateMediaValue(asset.thumbnailPublicId)
      : null,
    caption: asset.caption ?? null,
    position: index,
  }));

  const normalizedCoverAssetId =
    assets.find((asset) => asset.id === data.coverAssetId)?.id ??
    assets[0]?.id ??
    null;

  return {
    name: data.name,
    slug: data.slug,
    summary: data.summary,
    description: data.description ?? null,
    websiteUrl: data.websiteUrl ?? null,
    highlights: serializeJsonStringArray(parseJsonStringArray(data.highlights)),
    coverAssetId: normalizedCoverAssetId,
    isVisible: data.isVisible,
    position: data.position,
    assets,
  };
}

function normalizeReferralLinkData(data: ReferralLinkInput) {
  return {
    displayName: data.displayName,
    slug: data.slug,
    email: data.email.toLowerCase(),
    location: data.location ?? null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    status: data.status,
    notificationEnabled: data.notificationEnabled,
  };
}

function createReferralCode() {
  return `ref_${randomUUID().replaceAll("-", "").slice(0, 20)}`;
}

function normalizeTestimonialData(data: SchoolWebsiteTestimonialInput) {
  return {
    ...data,
    logoPublicId: data.logoPublicId
      ? (getCloudinaryPublicId(data.logoPublicId) ?? data.logoPublicId)
      : null,
  };
}

function normalizePortalMediaValue(value: string) {
  const trimmedValue = value.trim();

  if (
    trimmedValue.startsWith("/") ||
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://")
  ) {
    return trimmedValue;
  }

  return getCloudinaryPublicId(trimmedValue) ?? trimmedValue;
}

function normalizePortalFeatureCardData(data: SchoolPortalFeatureCardInput) {
  const assets = data.assets.map((asset, index) => ({
    id: asset.id?.trim() || randomUUID(),
    publicId: normalizePortalMediaValue(asset.publicId),
    mediaType: asset.mediaType,
    thumbnailPublicId: asset.thumbnailPublicId
      ? normalizePortalMediaValue(asset.thumbnailPublicId)
      : null,
    caption: asset.caption ?? null,
    position: index,
  }));

  const normalizedCoverAssetId =
    assets.find((asset) => asset.id === data.coverAssetId)?.id ??
    assets[0]?.id ??
    null;

  return {
    title: data.title,
    summary: data.summary,
    description: data.description,
    features: serializeJsonStringArray(parseJsonStringArray(data.features)),
    coverAssetId: normalizedCoverAssetId,
    youtubeUrl: data.youtubeUrl ?? null,
    isVisible: data.isVisible,
    position: data.position,
    assets,
  };
}

function mapTemplateRow(row: {
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
  assets: Array<{
    id: string;
    publicId: string;
    mediaType: "IMAGE" | "VIDEO";
    thumbnailPublicId: string | null;
    caption: string | null;
    position: number;
  }>;
}): SchoolWebsiteTemplateRow {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    websiteUrl: row.websiteUrl,
    highlights: parseJsonStringArray(row.highlights),
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
  };
}

function mapPortalFeatureCardRow(row: {
  id: string;
  title: string;
  summary: string;
  description: string;
  features: string;
  coverAssetId: string | null;
  youtubeUrl: string | null;
  isVisible: boolean;
  position: number;
  assets: Array<{
    id: string;
    publicId: string;
    mediaType: "IMAGE" | "VIDEO";
    thumbnailPublicId: string | null;
    caption: string | null;
    position: number;
  }>;
}): SchoolPortalFeatureCardRow {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    description: row.description,
    features: parseJsonStringArray(row.features),
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
  };
}

export async function getWeBrandSchoolsPageContent(): Promise<WeBrandSchoolsPageContentRow> {
  try {
    const row = await weBrandSchoolsPrisma.weBrandSchoolsPageContent.findFirst({
      orderBy: { id: "asc" },
    });

    if (!row) {
      return WE_BRAND_SCHOOLS_PAGE_CONTENT_DEFAULTS;
    }

    return withWeBrandSchoolsPageContentDefaults({
      logoPublicId: row.logoPublicId ?? null,
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
  } catch (error) {
    console.error("[getWeBrandSchoolsPageContent]", error);
    return WE_BRAND_SCHOOLS_PAGE_CONTENT_DEFAULTS;
  }
}

export async function updateWeBrandSchoolsPageContent(
  data: WeBrandSchoolsPageContentInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = weBrandSchoolsPageContentSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const sanitized = sanitizeWeBrandSchoolsPageContentInput(parsed.data);
    const normalized = normalizeContentData(sanitized);
    const unsupportedFields =
      getUnsupportedWeBrandSchoolsContentFields(normalized);

    if (unsupportedFields.length > 0) {
      const formattedFields = unsupportedFields
        .map((field) => `\`${field}\``)
        .join(", ");

      return {
        success: false,
        message: `The running Prisma client is out of date and can't save ${formattedFields} yet. Restart the dev server and try again.`,
      };
    }

    const existing =
      await weBrandSchoolsPrisma.weBrandSchoolsPageContent.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      });

    if (existing) {
      await weBrandSchoolsPrisma.weBrandSchoolsPageContent.update({
        where: { id: existing.id },
        data: normalized,
      });
    } else {
      await weBrandSchoolsPrisma.weBrandSchoolsPageContent.create({
        data: normalized,
      });
    }

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "We Brand Schools content updated successfully.",
    };
  } catch (error) {
    console.error("[updateWeBrandSchoolsPageContent]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update We Brand Schools content.",
    };
  }
}

export async function getSchoolWebsiteTestimonialsAdmin(): Promise<
  SchoolWebsiteTestimonialRow[]
> {
  try {
    const rows = await listSchoolWebsiteTestimonials();

    return rows.map((row: SchoolWebsiteTestimonialRow) => ({
      id: row.id,
      schoolName: row.schoolName,
      logoPublicId: row.logoPublicId ?? null,
      quote: row.quote,
      authorName: row.authorName,
      authorPosition: row.authorPosition,
      isVisible: row.isVisible,
      position: row.position,
    }));
  } catch (error) {
    console.error("[getSchoolWebsiteTestimonialsAdmin]", error);
    return [];
  }
}

export async function createSchoolWebsiteTestimonial(
  data: SchoolWebsiteTestimonialInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = schoolWebsiteTestimonialSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    await createSchoolWebsiteTestimonialRecord(
      normalizeTestimonialData(parsed.data),
    );

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Testimonial card created successfully.",
    };
  } catch (error) {
    console.error("[createSchoolWebsiteTestimonial]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create testimonial card.",
    };
  }
}

export async function updateSchoolWebsiteTestimonial(
  id: string,
  data: SchoolWebsiteTestimonialInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = schoolWebsiteTestimonialSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    await updateSchoolWebsiteTestimonialRecord(
      id,
      normalizeTestimonialData(parsed.data),
    );

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Testimonial card updated successfully.",
    };
  } catch (error) {
    console.error("[updateSchoolWebsiteTestimonial]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update testimonial card.",
    };
  }
}

export async function deleteSchoolWebsiteTestimonial(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAuth();

    await deleteSchoolWebsiteTestimonialRecord(id);

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Testimonial card deleted successfully.",
    };
  } catch (error) {
    console.error("[deleteSchoolWebsiteTestimonial]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete testimonial card.",
    };
  }
}

export async function deleteSchoolWebsiteTestimonials(
  ids: string[],
): Promise<ActionResult> {
  try {
    await requireAuth();

    if (!ids.length) {
      return { success: false, message: "No testimonials selected." };
    }

    await deleteSchoolWebsiteTestimonialsRecord(ids);

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: `Deleted ${ids.length} testimonial card${ids.length === 1 ? "" : "s"} successfully.`,
    };
  } catch (error) {
    console.error("[deleteSchoolWebsiteTestimonials]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete testimonials.",
    };
  }
}

export async function getReferralLinksAdmin(): Promise<ReferralLinkRow[]> {
  try {
    const rows = await weBrandSchoolsPrisma.referralLink.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        code: true,
        slug: true,
        displayName: true,
        email: true,
        location: true,
        expiresAt: true,
        status: true,
        notificationEnabled: true,
        createdByAdminId: true,
        createdByAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            applications: true,
          },
        },
        events: {
          select: {
            eventType: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        applications: {
          select: {
            status: true,
            templateId: true,
            selectedTemplateName: true,
          },
        },
        notificationLogs: {
          select: {
            status: true,
            createdAt: true,
            sentAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    return (rows as ReferralLinkQueryRow[]).map((row) => {
      const visitCount = row.events.filter(
        (event) => event.eventType === "VISIT",
      ).length;
      const templateSelectionEventCount = row.events.filter(
        (event) => event.eventType === "TEMPLATE_SELECTED",
      ).length;
      const submittedTemplateSelectionCount = row.applications.filter(
        (application) =>
          Boolean(application.templateId) ||
          Boolean(application.selectedTemplateName.trim()),
      ).length;
      const templateSelectionCount = Math.max(
        templateSelectionEventCount,
        submittedTemplateSelectionCount,
      );
      const siteLiveEventCount = row.events.filter(
        (event) => event.eventType === "SITE_LIVE",
      ).length;
      const liveApplicationCount = row.applications.filter(
        (application) => application.status === "LIVE",
      ).length;
      const liveSiteCount = Math.max(siteLiveEventCount, liveApplicationCount);
      const lastEventAt = row.events[0]?.createdAt ?? null;
      const latestNotification = row.notificationLogs[0] ?? null;
      const latestNotificationAt =
        latestNotification?.sentAt ?? latestNotification?.createdAt ?? null;
      const lastActivityAt = [lastEventAt, latestNotificationAt]
        .filter((value): value is Date => Boolean(value))
        .sort((first, second) => second.getTime() - first.getTime())[0];

      return {
        id: row.id,
        code: row.code,
        slug: row.slug,
        displayName: row.displayName,
        email: row.email,
        location: row.location,
        expiresAt: row.expiresAt,
        status: row.status as ReferralLinkStatusRow,
        notificationEnabled: row.notificationEnabled,
        createdByAdminId: row.createdByAdminId,
        createdByAdmin: row.createdByAdmin,
        deletedAt: row.deletedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        applicationCount: row._count.applications,
        visitCount,
        templateSelectionCount,
        liveSiteCount,
        conversionRate:
          visitCount > 0 ? row._count.applications / visitCount : null,
        lastActivityAt: lastActivityAt ?? null,
        latestNotificationStatus: latestNotification?.status ?? null,
        latestNotificationAt,
      };
    });
  } catch (error) {
    console.error("[getReferralLinksAdmin]", error);
    return [];
  }
}

export async function createReferralLink(
  data: ReferralLinkInput,
): Promise<ActionResult> {
  try {
    const { adminUser } = await requireAuth();

    const parsed = referralLinkSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const normalized = normalizeReferralLinkData(parsed.data);
    const existingSlug = await weBrandSchoolsPrisma.referralLink.findUnique({
      where: { slug: normalized.slug },
      select: { id: true, deletedAt: true },
    });

    if (existingSlug) {
      return {
        success: false,
        message: existingSlug.deletedAt
          ? "That referral slug was used by a deleted link. Use another slug."
          : "That referral slug is already in use.",
      };
    }

    await weBrandSchoolsPrisma.referralLink.create({
      data: {
        ...normalized,
        code: createReferralCode(),
        createdByAdminId: adminUser.id,
      },
    });

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Referral link created successfully.",
    };
  } catch (error) {
    console.error("[createReferralLink]", error);
    return {
      success: false,
      message: isUniqueConstraintError(error)
        ? "That referral slug or code is already in use."
        : error instanceof Error
          ? error.message
          : "Failed to create referral link.",
    };
  }
}

export async function updateReferralLink(
  id: string,
  data: ReferralLinkInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = referralLinkSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const normalized = normalizeReferralLinkData(parsed.data);
    const existing = await weBrandSchoolsPrisma.referralLink.findFirst({
      where: {
        slug: normalized.slug,
        id: { not: id },
      },
      select: { id: true, deletedAt: true },
    });

    if (existing) {
      return {
        success: false,
        message: existing.deletedAt
          ? "That referral slug was used by a deleted link. Use another slug."
          : "That referral slug is already in use.",
      };
    }

    await weBrandSchoolsPrisma.referralLink.update({
      where: { id },
      data: normalized,
    });

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Referral link updated successfully.",
    };
  } catch (error) {
    console.error("[updateReferralLink]", error);
    return {
      success: false,
      message: isUniqueConstraintError(error)
        ? "That referral slug is already in use."
        : error instanceof Error
          ? error.message
          : "Failed to update referral link.",
    };
  }
}

export async function updateReferralLinkStatus(
  id: string,
  status: ReferralLinkStatusRow,
): Promise<ActionResult> {
  try {
    await requireAuth();

    if (status !== "ACTIVE" && status !== "INACTIVE") {
      return {
        success: false,
        message: "Invalid referral link status.",
      };
    }

    await weBrandSchoolsPrisma.referralLink.update({
      where: { id },
      data: { status },
    });

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message:
        status === "ACTIVE"
          ? "Referral link activated successfully."
          : "Referral link deactivated successfully.",
    };
  } catch (error) {
    console.error("[updateReferralLinkStatus]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update referral link status.",
    };
  }
}

export async function deleteReferralLink(id: string): Promise<ActionResult> {
  try {
    await requireAuth();

    await weBrandSchoolsPrisma.referralLink.update({
      where: { id },
      data: {
        status: "INACTIVE",
        deletedAt: new Date(),
      },
    });

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Referral link deleted successfully.",
    };
  } catch (error) {
    console.error("[deleteReferralLink]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete referral link.",
    };
  }
}

export async function deleteReferralLinks(
  ids: string[],
): Promise<ActionResult> {
  try {
    await requireAuth();

    if (!ids.length) {
      return { success: false, message: "No referrals selected." };
    }

    await weBrandSchoolsPrisma.referralLink.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "INACTIVE",
        deletedAt: new Date(),
      },
    });

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: `Deleted ${ids.length} referral link${ids.length === 1 ? "" : "s"} successfully.`,
    };
  } catch (error) {
    console.error("[deleteReferralLinks]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete referral links.",
    };
  }
}

export async function getSchoolWebsiteTemplatesAdmin(): Promise<
  SchoolWebsiteTemplateRow[]
> {
  try {
    const rows = await weBrandSchoolsPrisma.schoolWebsiteTemplate.findMany({
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

    return rows.map(mapTemplateRow);
  } catch (error) {
    console.error("[getSchoolWebsiteTemplatesAdmin]", error);
    return [];
  }
}

export async function createSchoolWebsiteTemplate(
  data: SchoolWebsiteTemplateInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = schoolWebsiteTemplateSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const normalized = normalizeTemplateData(parsed.data);

    const created = await weBrandSchoolsPrisma.schoolWebsiteTemplate.create({
      data: {
        name: normalized.name,
        slug: normalized.slug,
        summary: normalized.summary,
        description: normalized.description,
        websiteUrl: normalized.websiteUrl,
        highlights: normalized.highlights,
        coverAssetId: null,
        isVisible: normalized.isVisible,
        position: normalized.position,
        assets: {
          create: normalized.assets.map((asset) => ({
            id: asset.id,
            publicId: asset.publicId,
            mediaType: asset.mediaType,
            thumbnailPublicId: asset.thumbnailPublicId,
            caption: asset.caption,
            position: asset.position,
          })),
        },
      },
      select: { id: true },
    });

    if (normalized.coverAssetId) {
      await weBrandSchoolsPrisma.schoolWebsiteTemplate.update({
        where: { id: created.id },
        data: { coverAssetId: normalized.coverAssetId },
      });
    }

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Template created successfully.",
    };
  } catch (error) {
    console.error("[createSchoolWebsiteTemplate]", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create template.",
    };
  }
}

export async function updateSchoolWebsiteTemplate(
  id: string,
  data: SchoolWebsiteTemplateInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = schoolWebsiteTemplateSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const normalized = normalizeTemplateData(parsed.data);

    await weBrandSchoolsPrisma.$transaction(async (tx) => {
      await tx.schoolWebsiteTemplate.update({
        where: { id },
        data: { coverAssetId: null },
      });

      await tx.schoolWebsiteTemplateAsset.deleteMany({
        where: { templateId: id },
      });

      await tx.schoolWebsiteTemplate.update({
        where: { id },
        data: {
          name: normalized.name,
          slug: normalized.slug,
          summary: normalized.summary,
          description: normalized.description,
          websiteUrl: normalized.websiteUrl,
          highlights: normalized.highlights,
          coverAssetId: null,
          isVisible: normalized.isVisible,
          position: normalized.position,
          assets: {
            create: normalized.assets.map((asset) => ({
              id: asset.id,
              publicId: asset.publicId,
              mediaType: asset.mediaType,
              thumbnailPublicId: asset.thumbnailPublicId,
              caption: asset.caption,
              position: asset.position,
            })),
          },
        },
      });

      if (normalized.coverAssetId) {
        await tx.schoolWebsiteTemplate.update({
          where: { id },
          data: { coverAssetId: normalized.coverAssetId },
        });
      }
    });

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Template updated successfully.",
    };
  } catch (error) {
    console.error("[updateSchoolWebsiteTemplate]", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update template.",
    };
  }
}

export async function deleteSchoolWebsiteTemplate(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAuth();

    await weBrandSchoolsPrisma.schoolWebsiteTemplate.delete({
      where: { id },
    });

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Template deleted successfully.",
    };
  } catch (error) {
    console.error("[deleteSchoolWebsiteTemplate]", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete template.",
    };
  }
}

export async function deleteSchoolWebsiteTemplates(
  ids: string[],
): Promise<ActionResult> {
  try {
    await requireAuth();

    if (!ids.length) {
      return { success: false, message: "No templates selected." };
    }

    await weBrandSchoolsPrisma.schoolWebsiteTemplate.updateMany({
      where: { id: { in: ids } },
      data: { coverAssetId: null },
    });

    await weBrandSchoolsPrisma.schoolWebsiteTemplateAsset.deleteMany({
      where: { templateId: { in: ids } },
    });

    await weBrandSchoolsPrisma.schoolWebsiteTemplate.deleteMany({
      where: { id: { in: ids } },
    });

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: `Deleted ${ids.length} template${ids.length === 1 ? "" : "s"} successfully.`,
    };
  } catch (error) {
    console.error("[deleteSchoolWebsiteTemplates]", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete templates.",
    };
  }
}

export async function getSchoolPortalSectionContentAdmin(): Promise<SchoolPortalSectionContentRow> {
  try {
    const row = await weBrandSchoolsPrisma.schoolPortalSectionContent.findFirst(
      {
        orderBy: { id: "asc" },
        select: {
          eyebrow: true,
          title: true,
          description: true,
          ctaText: true,
          ctaHref: true,
          isVisible: true,
        },
      },
    );

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
  } catch (error) {
    console.error("[getSchoolPortalSectionContentAdmin]", error);
    return SCHOOL_PORTAL_SECTION_CONTENT_DEFAULTS;
  }
}

export async function updateSchoolPortalSectionContent(
  data: SchoolPortalSectionContentInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = schoolPortalSectionContentSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const existing =
      await weBrandSchoolsPrisma.schoolPortalSectionContent.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      });

    if (existing) {
      await weBrandSchoolsPrisma.schoolPortalSectionContent.update({
        where: { id: existing.id },
        data: parsed.data,
      });
    } else {
      await weBrandSchoolsPrisma.schoolPortalSectionContent.create({
        data: parsed.data,
      });
    }

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Portal section content updated successfully.",
    };
  } catch (error) {
    console.error("[updateSchoolPortalSectionContent]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update portal section content.",
    };
  }
}

export async function getSchoolPortalFeatureCardsAdmin(): Promise<
  SchoolPortalFeatureCardRow[]
> {
  try {
    const rows = await weBrandSchoolsPrisma.schoolPortalFeatureCard.findMany({
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

    return rows.map(mapPortalFeatureCardRow);
  } catch (error) {
    console.error("[getSchoolPortalFeatureCardsAdmin]", error);
    return [];
  }
}

export async function createSchoolPortalFeatureCard(
  data: SchoolPortalFeatureCardInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = schoolPortalFeatureCardSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const normalized = normalizePortalFeatureCardData(parsed.data);

    const created = await weBrandSchoolsPrisma.schoolPortalFeatureCard.create({
      data: {
        title: normalized.title,
        summary: normalized.summary,
        description: normalized.description,
        features: normalized.features,
        coverAssetId: null,
        youtubeUrl: normalized.youtubeUrl,
        isVisible: normalized.isVisible,
        position: normalized.position,
        assets: {
          create: normalized.assets.map((asset) => ({
            id: asset.id,
            publicId: asset.publicId,
            mediaType: asset.mediaType,
            thumbnailPublicId: asset.thumbnailPublicId,
            caption: asset.caption,
            position: asset.position,
          })),
        },
      },
      select: { id: true },
    });

    if (normalized.coverAssetId) {
      await weBrandSchoolsPrisma.schoolPortalFeatureCard.update({
        where: { id: created.id },
        data: { coverAssetId: normalized.coverAssetId },
      });
    }

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Portal card created successfully.",
    };
  } catch (error) {
    console.error("[createSchoolPortalFeatureCard]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create portal card.",
    };
  }
}

export async function updateSchoolPortalFeatureCard(
  id: string,
  data: SchoolPortalFeatureCardInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = schoolPortalFeatureCardSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const normalized = normalizePortalFeatureCardData(parsed.data);

    await weBrandSchoolsPrisma.$transaction(async (tx) => {
      const portalTx = tx as typeof tx &
        SchoolPortalFeatureCardTransactionClient;

      await portalTx.schoolPortalFeatureCard.update({
        where: { id },
        data: { coverAssetId: null },
      });

      await portalTx.schoolPortalFeatureAsset.deleteMany({
        where: { cardId: id },
      });

      await portalTx.schoolPortalFeatureCard.update({
        where: { id },
        data: {
          title: normalized.title,
          summary: normalized.summary,
          description: normalized.description,
          features: normalized.features,
          coverAssetId: null,
          youtubeUrl: normalized.youtubeUrl,
          isVisible: normalized.isVisible,
          position: normalized.position,
          assets: {
            create: normalized.assets.map((asset) => ({
              id: asset.id,
              publicId: asset.publicId,
              mediaType: asset.mediaType,
              thumbnailPublicId: asset.thumbnailPublicId,
              caption: asset.caption,
              position: asset.position,
            })),
          },
        },
      });

      if (normalized.coverAssetId) {
        await portalTx.schoolPortalFeatureCard.update({
          where: { id },
          data: { coverAssetId: normalized.coverAssetId },
        });
      }
    });

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Portal card updated successfully.",
    };
  } catch (error) {
    console.error("[updateSchoolPortalFeatureCard]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update portal card.",
    };
  }
}

export async function deleteSchoolPortalFeatureCard(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAuth();

    await weBrandSchoolsPrisma.schoolPortalFeatureCard.delete({
      where: { id },
    });

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Portal card deleted successfully.",
    };
  } catch (error) {
    console.error("[deleteSchoolPortalFeatureCard]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete portal card.",
    };
  }
}

export async function getSchoolWebsiteApplicationsAdmin(): Promise<
  SchoolWebsiteApplicationRow[]
> {
  try {
    const rows = await weBrandSchoolsPrisma.schoolWebsiteApplication.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            status: true,
          },
        },
        referralLink: {
          select: {
            id: true,
            code: true,
            slug: true,
            displayName: true,
            email: true,
            location: true,
            status: true,
            expiresAt: true,
            deletedAt: true,
          },
        },
      },
    });

    return rows.map(
      (row: {
        id: string;
        templateId: string | null;
        referralLinkId: string | null;
        referralCodeSnapshot: string | null;
        referralNameSnapshot: string | null;
        referralSlugSnapshot: string | null;
        referralEmailSnapshot: string | null;
        referralLocationSnapshot: string | null;
        selectedTemplateName: string;
        schoolName: string;
        aboutSchool: string;
        vision: string;
        mission: string;
        coreValues: string;
        officialPhone: string;
        officialEmail: string;
        officialAddress: string;
        officialWebsiteUrl: string | null;
        officialContactName: string | null;
        officialContactRole: string | null;
        officialContactPhone: string | null;
        officialContactEmail: string | null;
        domainChoice: SchoolWebsiteApplicationRow["domainChoice"];
        existingDomain: string | null;
        preferredDomain1: string | null;
        preferredDomain2: string | null;
        status: SchoolWebsiteApplicationRow["status"];
        adminNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        template: {
          id: string;
          name: string;
        } | null;
        referralLink: {
          id: string;
          code: string;
          slug: string;
          displayName: string;
          email: string;
          location: string | null;
          status: ReferralLinkStatusRow;
          expiresAt: Date | null;
          deletedAt: Date | null;
        } | null;
        project: {
          id: string;
          status: SchoolWebsiteProjectStatusRow;
        } | null;
      }) => ({
        id: row.id,
        templateId: row.templateId ?? null,
        referralLinkId: row.referralLinkId ?? null,
        referralCodeSnapshot: row.referralCodeSnapshot ?? null,
        referralNameSnapshot: row.referralNameSnapshot ?? null,
        referralSlugSnapshot: row.referralSlugSnapshot ?? null,
        referralEmailSnapshot: row.referralEmailSnapshot ?? null,
        referralLocationSnapshot: row.referralLocationSnapshot ?? null,
        selectedTemplateName: row.selectedTemplateName,
        schoolName: row.schoolName,
        aboutSchool: row.aboutSchool,
        vision: row.vision,
        mission: row.mission,
        coreValues: row.coreValues,
        officialPhone: row.officialPhone,
        officialEmail: row.officialEmail,
        officialAddress: row.officialAddress,
        officialWebsiteUrl: row.officialWebsiteUrl ?? null,
        officialContactName: row.officialContactName ?? null,
        officialContactRole: row.officialContactRole ?? null,
        officialContactPhone: row.officialContactPhone ?? null,
        officialContactEmail: row.officialContactEmail ?? null,
        domainChoice: row.domainChoice,
        existingDomain: row.existingDomain ?? null,
        preferredDomain1: row.preferredDomain1 ?? null,
        preferredDomain2: row.preferredDomain2 ?? null,
        status: row.status,
        adminNotes: row.adminNotes ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        template: row.template
          ? {
              id: row.template.id,
              name: row.template.name,
            }
          : null,
        referralLink: row.referralLink
          ? {
              id: row.referralLink.id,
              code: row.referralLink.code,
              slug: row.referralLink.slug,
              displayName: row.referralLink.displayName,
              email: row.referralLink.email,
              location: row.referralLink.location,
              status: row.referralLink.status as ReferralLinkStatusRow,
              expiresAt: row.referralLink.expiresAt,
              deletedAt: row.referralLink.deletedAt,
            }
          : null,
        project: row.project
          ? {
              id: row.project.id,
              status: row.project.status,
            }
          : null,
      }),
    );
  } catch (error) {
    console.error("[getSchoolWebsiteApplicationsAdmin]", error);
    return [];
  }
}

export async function getSchoolWebsiteProjectsAdmin(): Promise<
  SchoolWebsiteProjectRow[]
> {
  try {
    await requireAuth();

    const projects = (await weBrandSchoolsPrisma.schoolWebsiteProject.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        applicationId: true,
        schoolName: true,
        templateName: true,
        templateSlug: true,
        contactEmail: true,
        status: true,
        contentJson: true,
        exportZipUrl: true,
        lastExportedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })) as SchoolWebsiteProjectAdminQueryRow[];

    return projects.map((project) => {
      const parsedContent = parseSchoolTemplateProjectContent(
        project.contentJson,
      );
      const previewPageSlug = parsedContent.success
        ? (parsedContent.data.pages.find((page) => page.isHome)?.slug ??
          parsedContent.data.pages[0]?.slug ??
          "home")
        : "home";

      return {
        id: project.id,
        applicationId: project.applicationId,
        schoolName: project.schoolName,
        templateName: project.templateName,
        templateSlug: project.templateSlug,
        contactEmail: project.contactEmail,
        status: project.status as SchoolWebsiteProjectStatusRow,
        previewPageSlug,
        exportZipUrl: project.exportZipUrl,
        lastExportedAt: project.lastExportedAt,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    });
  } catch (error) {
    console.error("[getSchoolWebsiteProjectsAdmin]", error);
    return [];
  }
}

export async function startSchoolWebsiteProject(
  applicationId: string,
): Promise<StartSchoolWebsiteProjectResult> {
  try {
    await requireAuth();

    const application =
      await weBrandSchoolsPrisma.schoolWebsiteApplication.findUnique({
        where: { id: applicationId },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              slug: true,
              websiteUrl: true,
            },
          },
          project: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!application) {
      return {
        success: false,
        message: "School website application was not found.",
      };
    }

    if (application.project) {
      await weBrandSchoolsPrisma.$transaction([
        weBrandSchoolsPrisma.schoolWebsiteApplication.update({
          where: { id: application.id },
          data: { status: "IN_PROGRESS" },
        }),
        weBrandSchoolsPrisma.schoolWebsiteProject.update({
          where: { id: application.project.id },
          data: { status: "IN_PROGRESS" },
        }),
      ]);

      revalidateWeBrandSchoolsAdmin();

      return {
        success: true,
        message: "Project already exists. Opening editor.",
        projectId: application.project.id,
        redirectHref: getSchoolWebsiteProjectEditorHref(application.project.id),
      };
    }

    if (!application.template) {
      return {
        success: false,
        message:
          "This application is not attached to a template. Attach a template before starting.",
      };
    }

    const manifest = resolveSchoolTemplateManifestForSelection({
      templateSlug: application.template.slug,
      websiteUrl: application.template.websiteUrl,
    });

    if (!manifest) {
      return {
        success: false,
        message:
          "No editable manifest was found for this template. Use a template slug or URL that matches dexta-academy-1, dexta-academy-2, dexta-academy-3, dexta-academy-4, or dexta-academy-5.",
      };
    }

    const contentJson = applySchoolNameFallbackToProjectContent(
      buildSchoolTemplateProjectContent(manifest),
      application.schoolName,
    );
    const sourceSnapshot = buildSchoolTemplateSourceSnapshot(manifest);

    const project = await weBrandSchoolsPrisma.$transaction(async (tx) => {
      const createdProject = await tx.schoolWebsiteProject.create({
        data: {
          applicationId: application.id,
          templateId: application.template.id,
          templateSlug: manifest.templateSlug,
          templateName: application.template.name,
          schoolName: application.schoolName,
          contactEmail:
            application.officialContactEmail ?? application.officialEmail,
          status: "IN_PROGRESS",
          contentJson,
          sourceSnapshot,
          revisions: {
            create: {
              contentJson,
              note: "Initial project copy created from template manifest.",
            },
          },
        },
        select: {
          id: true,
        },
      });

      await tx.schoolWebsiteApplication.update({
        where: { id: application.id },
        data: { status: "IN_PROGRESS" },
      });

      return createdProject;
    });

    revalidateWeBrandSchoolsAdmin();

    return {
      success: true,
      message: "Project created. Opening editor.",
      projectId: project.id,
      redirectHref: getSchoolWebsiteProjectEditorHref(project.id),
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existingProject =
        await weBrandSchoolsPrisma.schoolWebsiteProject.findUnique({
          where: { applicationId },
          select: { id: true },
        });

      if (existingProject) {
        revalidateWeBrandSchoolsAdmin();
        return {
          success: true,
          message: "Project already exists. Opening editor.",
          projectId: existingProject.id,
          redirectHref: getSchoolWebsiteProjectEditorHref(existingProject.id),
        };
      }
    }

    console.error("[startSchoolWebsiteProject]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to start school website project.",
    };
  }
}

export async function getSchoolWebsiteProject(
  projectId: string,
): Promise<SchoolWebsiteProjectEditorDataResult> {
  try {
    await requireAuth();

    const project = await weBrandSchoolsPrisma.schoolWebsiteProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        applicationId: true,
        schoolName: true,
        templateSlug: true,
        status: true,
        contentJson: true,
        sourceSnapshot: true,
        exportZipUrl: true,
        lastExportedAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return {
        success: false,
        message: "School website project was not found.",
      };
    }

    const safeProjectContent = getSafeProjectContent({
      contentJson: project.contentJson,
      sourceSnapshot: project.sourceSnapshot,
      templateSlug: project.templateSlug,
    });
    if (!safeProjectContent.success) return safeProjectContent;

    const contentJson = applySchoolNameFallbackToProjectContent(
      safeProjectContent.contentJson,
      project.schoolName,
    );

    return {
      success: true,
      message: "Project loaded successfully.",
      project: {
        ...project,
        status: project.status as SchoolWebsiteProjectStatusRow,
        contentJson,
        sourceSnapshot: safeProjectContent.sourceSnapshot,
      },
    };
  } catch (error) {
    console.error("[getSchoolWebsiteProject]", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to load project.",
    };
  }
}

export async function createSchoolWebsiteProjectRevision(
  projectId: string,
  contentJson?: unknown,
  note?: string,
): Promise<SchoolWebsiteProjectRevisionResult> {
  try {
    await requireAuth();

    let revisionContent: SchoolTemplateProjectContent;
    const project = await weBrandSchoolsPrisma.schoolWebsiteProject.findUnique({
      where: { id: projectId },
      select: { templateSlug: true, contentJson: true, sourceSnapshot: true },
    });

    if (!project) {
      return {
        success: false,
        message: "School website project was not found.",
      };
    }

    const safeProjectContent = getSafeProjectContent({
      contentJson: contentJson ?? project.contentJson,
      sourceSnapshot: project.sourceSnapshot,
      templateSlug: project.templateSlug,
    });

    if (!safeProjectContent.success) {
      return safeProjectContent;
    }

    revisionContent = safeProjectContent.contentJson;

    const revision = await createSchoolWebsiteProjectRevisionRecord({
      projectId,
      contentJson: revisionContent,
      note: note ?? "Revision created from admin editor.",
    });

    revalidatePath(`/admin/we-brand-schools/projects/${projectId}/editor`);

    return {
      success: true,
      message: "Revision created successfully.",
      revisionId: revision.id,
    };
  } catch (error) {
    console.error("[createSchoolWebsiteProjectRevision]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create project revision.",
    };
  }
}

export async function saveSchoolWebsiteProject(
  projectId: string,
  contentJson: unknown,
  options: SaveSchoolWebsiteProjectOptions = {},
): Promise<SaveSchoolWebsiteProjectDraftResult> {
  try {
    await requireAuth();

    const project = await weBrandSchoolsPrisma.schoolWebsiteProject.findUnique({
      where: { id: projectId },
      select: {
        applicationId: true,
        templateSlug: true,
        contentJson: true,
        sourceSnapshot: true,
      },
    });

    if (!project) {
      return {
        success: false,
        message: "School website project was not found.",
      };
    }

    if (
      options.applicationId &&
      project.applicationId !== options.applicationId
    ) {
      return {
        success: false,
        message: "Project does not belong to the selected application.",
      };
    }

    const safeProjectContent = getSafeProjectContent({
      contentJson,
      sourceSnapshot: project.sourceSnapshot,
      templateSlug: project.templateSlug,
    });

    if (!safeProjectContent.success) {
      return safeProjectContent;
    }

    const contentToSave: SchoolTemplateProjectContent = {
      ...safeProjectContent.contentJson,
      generatedAt: new Date().toISOString(),
    };

    if (options.createRevision) {
      const existingProjectContent = getSafeProjectContent({
        contentJson: project.contentJson,
        sourceSnapshot: project.sourceSnapshot,
        templateSlug: project.templateSlug,
      });

      if (existingProjectContent.success) {
        await createSchoolWebsiteProjectRevisionRecord({
          projectId,
          contentJson: existingProjectContent.contentJson,
          note: `Before ${options.note ?? "major project save"}`,
        });
      }
    }

    const updatedProject =
      await weBrandSchoolsPrisma.schoolWebsiteProject.update({
        where: { id: projectId },
        data: {
          status: "IN_PROGRESS",
          contentJson: contentToSave,
          sourceSnapshot: safeProjectContent.sourceSnapshot,
        },
        select: {
          updatedAt: true,
        },
      });

    revalidateWeBrandSchoolsAdmin();
    revalidatePath(`/admin/we-brand-schools/projects/${projectId}/editor`);

    return {
      success: true,
      message: "Draft saved successfully.",
      updatedAt: updatedProject.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("[saveSchoolWebsiteProject]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to save project draft.",
    };
  }
}

export async function saveSchoolWebsiteProjectDraft(
  projectId: string,
  contentJson: unknown,
  options: SaveSchoolWebsiteProjectOptions = { createRevision: true },
): Promise<SaveSchoolWebsiteProjectDraftResult> {
  return saveSchoolWebsiteProject(projectId, contentJson, options);
}

export async function generateSchoolWebsiteProjectPreviewLink({
  projectId,
  applicationId,
  pageSlug,
}: {
  projectId: string;
  applicationId: string;
  pageSlug: string;
}): Promise<GenerateSchoolWebsiteProjectPreviewLinkResult> {
  try {
    await requireAuth();

    const project = await weBrandSchoolsPrisma.schoolWebsiteProject.findUnique({
      where: { id: projectId },
      select: {
        applicationId: true,
        contentJson: true,
      },
    });

    if (!project) {
      return {
        success: false,
        message: "School website project was not found.",
      };
    }

    if (project.applicationId !== applicationId) {
      return {
        success: false,
        message: "Project does not belong to the selected application.",
      };
    }

    const parsedContent = parseSchoolTemplateProjectContent(
      project.contentJson,
    );
    if (
      !parsedContent.success ||
      !parsedContent.data.pages.some((page) => page.slug === pageSlug)
    ) {
      return {
        success: false,
        message: "Preview page was not found for this project.",
      };
    }

    return {
      success: true,
      message: "Preview link generated.",
      previewHref: getSchoolWebsiteProjectPreviewHref({
        projectId,
        pageSlug,
      }),
    };
  } catch (error) {
    console.error("[generateSchoolWebsiteProjectPreviewLink]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate preview link.",
    };
  }
}

export async function resetSchoolWebsiteProjectToOriginal(
  projectId: string,
  applicationId?: string,
): Promise<ResetSchoolWebsiteProjectResult> {
  try {
    await requireAuth();

    const project = await weBrandSchoolsPrisma.schoolWebsiteProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        applicationId: true,
        templateSlug: true,
        templateName: true,
        contentJson: true,
        sourceSnapshot: true,
      },
    });

    if (!project) {
      return {
        success: false,
        message: "School website project was not found.",
      };
    }

    if (applicationId && project.applicationId !== applicationId) {
      return {
        success: false,
        message: "Project does not belong to the selected application.",
      };
    }

    const manifest = resolveSchoolTemplateManifestForSelection({
      templateSlug: project.templateSlug,
    });

    if (!manifest) {
      return {
        success: false,
        message: "Original template settings could not be found.",
      };
    }

    const existingProjectContent = getSafeProjectContent({
      contentJson: project.contentJson,
      sourceSnapshot: project.sourceSnapshot,
      templateSlug: project.templateSlug,
    });

    if (existingProjectContent.success) {
      await createSchoolWebsiteProjectRevisionRecord({
        projectId: project.id,
        contentJson: existingProjectContent.contentJson,
        note: "Before restoring original template settings.",
      });
    }

    const originalContent = {
      ...buildSchoolTemplateProjectContent(manifest),
      templateName: project.templateName,
      generatedAt: new Date().toISOString(),
    };
    const originalSourceSnapshot = buildSchoolTemplateSourceSnapshot(manifest);

    const updatedProject =
      await weBrandSchoolsPrisma.schoolWebsiteProject.update({
        where: { id: project.id },
        data: {
          status: "IN_PROGRESS",
          contentJson: originalContent,
          sourceSnapshot: originalSourceSnapshot,
        },
        select: {
          updatedAt: true,
          status: true,
        },
      });

    revalidateWeBrandSchoolsAdmin();
    revalidatePath(`/admin/we-brand-schools/projects/${projectId}/editor`);

    return {
      success: true,
      message: "Project restored to the original template settings.",
      contentJson: originalContent,
      updatedAt: updatedProject.updatedAt.toISOString(),
      status: updatedProject.status as SchoolWebsiteProjectStatusRow,
    };
  } catch (error) {
    console.error("[resetSchoolWebsiteProjectToOriginal]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to restore original template settings.",
    };
  }
}

export async function extractSchoolWebsiteCopySuggestions({
  url,
  sectionLabel = "",
  excludedTexts = [],
  fields,
}: {
  url: string;
  sectionLabel?: string;
  excludedTexts?: string[];
  fields: Array<{
    key: string;
    label: string;
    type: string;
    currentValue?: unknown;
  }>;
}): Promise<ExtractSchoolWebsiteCopySuggestionsResult> {
  try {
    await requireAuth();

    const normalizedUrl = normalizeImportUrl(url);
    if (!normalizedUrl) {
      return {
        success: false,
        message: "Enter a valid http or https URL.",
      };
    }

    const importedPage = await requestImportedHtml(normalizedUrl);

    if (!importedPage.ok) {
      return {
        success: false,
        message: `Could not read that page. The server returned ${importedPage.status}.`,
      };
    }

    const contentType = importedPage.contentType;
    if (contentType && !contentType.toLowerCase().includes("html")) {
      return {
        success: false,
        message: "That URL did not return an HTML page.",
      };
    }

    const html = importedPage.html;
    const buckets = getImportedTextBuckets(html);
    const used = new Set(
      excludedTexts.map(normalizeCopyMemoryText).filter(Boolean),
    );
    const suggestions = fields
      .filter((field) => ["text", "textarea", "richText"].includes(field.type))
      .filter((field) => !isProtectedCopyImportField(field.key, field.label))
      .map((field) => ({
        fieldKey: field.key,
        label: field.label,
        value: pickImportedCopyForField({
          fieldKey: field.key,
          label: field.label,
          type: field.type,
          currentValue: field.currentValue,
          sectionLabel,
          buckets,
          used,
        }),
      }))
      .filter((suggestion) => suggestion.value.trim().length > 0);

    if (!suggestions.length) {
      return {
        success: false,
        message: "No usable write-up was found on that page.",
      };
    }

    return {
      success: true,
      message: "Copy suggestions extracted. Review and approve each one.",
      suggestions,
    };
  } catch (error) {
    console.error("[extractSchoolWebsiteCopySuggestions]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to extract write-up from that URL.",
    };
  }
}

export async function exportSchoolWebsiteProject(
  projectId: string,
  applicationId?: string,
): Promise<ExportSchoolWebsiteProjectResult> {
  const startedAt = Date.now();
  try {
    await requireAuth();

    const project = await weBrandSchoolsPrisma.schoolWebsiteProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        applicationId: true,
        schoolName: true,
        templateSlug: true,
        contentJson: true,
        sourceSnapshot: true,
      },
    });

    if (!project) {
      return {
        success: false,
        message: "School website project was not found.",
      };
    }

    if (applicationId && project.applicationId !== applicationId) {
      return {
        success: false,
        message: "Project does not belong to the selected application.",
      };
    }

    await createSchoolWebsiteProjectExportLog({
      projectId: project.id,
      status: "STARTED",
      message: "Export started.",
    });

    const safeProjectContent = getSafeProjectContent({
      contentJson: project.contentJson,
      sourceSnapshot: project.sourceSnapshot,
      templateSlug: project.templateSlug,
    });

    if (!safeProjectContent.success) {
      await createSchoolWebsiteProjectExportLog({
        projectId: project.id,
        status: "FAILED",
        message: safeProjectContent.message,
        durationMs: Date.now() - startedAt,
      });
      return safeProjectContent;
    }

    const contentJson = applySchoolNameFallbackToProjectContent(
      safeProjectContent.contentJson,
      project.schoolName,
    );

    await createSchoolWebsiteProjectRevisionRecord({
      projectId: project.id,
      contentJson,
      note: "Before export.",
    });

    const exportZip = await buildSchoolWebsiteProjectExportZip({
      content: contentJson,
      sourceSnapshot: safeProjectContent.sourceSnapshot,
    });
    const exportFileName =
      project.templateSlug === "dexta-academy-3"
        ? `${slugifyExportFileName(project.schoolName)}-website-${Date.now()}.zip`
        : `${slugifyExportFileName(project.schoolName)}-website.zip`;
    let exportZipUrl: string;

    try {
      const upload = await uploadRawBufferToCloudinary({
        buffer: exportZip.buffer,
        fileName: exportFileName,
        folder: `school-website-exports/${project.id}`,
      });
      exportZipUrl = upload.url;
    } catch (error) {
      if (!isCloudinaryFileSizeLimitError(error)) {
        throw error;
      }

      exportZipUrl = await writeExportZipToPublic({
        projectId: project.id,
        fileName: exportFileName,
        buffer: exportZip.buffer,
      });
    }
    const exportedAt = new Date();

    const updatedProject =
      await weBrandSchoolsPrisma.schoolWebsiteProject.update({
        where: { id: project.id },
        data: {
          status: "EXPORTED",
          exportZipUrl,
          lastExportedAt: exportedAt,
        },
        select: {
          exportZipUrl: true,
          lastExportedAt: true,
          status: true,
        },
      });

    await createSchoolWebsiteProjectExportLog({
      projectId: project.id,
      status: "SUCCESS",
      message: "Export zip generated successfully.",
      exportZipUrl: updatedProject.exportZipUrl ?? exportZipUrl,
      fileCount: exportZip.fileCount,
      pageCount: exportZip.pageCount,
      durationMs: Date.now() - startedAt,
    });

    revalidateWeBrandSchoolsAdmin();
    revalidatePath(`/admin/we-brand-schools/projects/${projectId}/editor`);

    return {
      success: true,
      message: "Export zip generated successfully.",
      exportZipUrl: updatedProject.exportZipUrl ?? exportZipUrl,
      lastExportedAt:
        updatedProject.lastExportedAt?.toISOString() ??
        exportedAt.toISOString(),
      status: updatedProject.status as SchoolWebsiteProjectStatusRow,
      fileCount: exportZip.fileCount,
      pageCount: exportZip.pageCount,
    };
  } catch (error) {
    console.error("[exportSchoolWebsiteProject]", error);
    await createSchoolWebsiteProjectExportLog({
      projectId,
      status: "FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Failed to export school website project.",
      durationMs: Date.now() - startedAt,
      detailsJson: {
        name: error instanceof Error ? error.name : "UnknownError",
      },
    });
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to export school website project.",
    };
  }
}

export async function updateSchoolWebsiteApplicationStatus(
  id: string,
  data: SchoolWebsiteApplicationStatusInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = schoolWebsiteApplicationStatusSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const application =
      await weBrandSchoolsPrisma.schoolWebsiteApplication.findUnique({
        where: { id },
        select: {
          id: true,
          schoolName: true,
          selectedTemplateName: true,
          status: true,
          referralLinkId: true,
          referralCodeSnapshot: true,
          referralNameSnapshot: true,
          referralSlugSnapshot: true,
          referralEmailSnapshot: true,
          officialEmail: true,
          officialContactName: true,
          officialContactEmail: true,
          existingDomain: true,
          preferredDomain1: true,
          officialWebsiteUrl: true,
          project: {
            select: {
              id: true,
              schoolName: true,
              templateName: true,
              exportZipUrl: true,
            },
          },
          referralLink: {
            select: {
              id: true,
              code: true,
              slug: true,
              displayName: true,
              email: true,
              notificationEnabled: true,
            },
          },
          referralNotificationLogs: {
            where: {
              type: "SITE_LIVE",
              status: "SENT",
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      });

    if (!application) {
      return {
        success: false,
        message: "School website application was not found.",
      };
    }

    if (
      parsed.data.status === "LIVE" &&
      application.status !== "LIVE" &&
      !parsed.data.goLiveDetails
    ) {
      return {
        success: false,
        message: "Go-live details are required before sending live emails.",
      };
    }

    const updateOperations = [
      weBrandSchoolsPrisma.schoolWebsiteApplication.update({
        where: { id },
        data: {
          status: parsed.data.status,
          adminNotes: parsed.data.adminNotes ?? null,
        },
      }),
    ];

    if (parsed.data.status === "LIVE" && application.project) {
      updateOperations.push(
        weBrandSchoolsPrisma.schoolWebsiteProject.update({
          where: { id: application.project.id },
          data: { status: "LIVE" },
        }),
      );
    }

    await weBrandSchoolsPrisma.$transaction(updateOperations);

    if (parsed.data.status === "LIVE") {
      if (application.status !== "LIVE") {
        await notifySchoolContactsSiteLive(
          {
            ...application,
            status: "LIVE",
            project: application.project
              ? {
                  id: application.project.id,
                  schoolName: application.project.schoolName,
                  templateName: application.project.templateName,
                  exportZipUrl: application.project.exportZipUrl,
                }
              : null,
            referralLink: application.referralLink
              ? {
                  id: application.referralLink.id,
                  code: application.referralLink.code,
                  slug: application.referralLink.slug,
                  displayName: application.referralLink.displayName,
                  email: application.referralLink.email,
                  notificationEnabled:
                    application.referralLink.notificationEnabled,
                }
              : null,
          },
          parsed.data.goLiveDetails!,
        );
      }

      await notifyReferralOwnerSiteLive(
        {
          ...application,
          status: "LIVE",
          project: application.project
            ? {
                id: application.project.id,
                schoolName: application.project.schoolName,
                templateName: application.project.templateName,
                exportZipUrl: application.project.exportZipUrl,
              }
            : null,
          referralLink: application.referralLink
            ? {
                id: application.referralLink.id,
                code: application.referralLink.code,
                slug: application.referralLink.slug,
                displayName: application.referralLink.displayName,
                email: application.referralLink.email,
                notificationEnabled:
                  application.referralLink.notificationEnabled,
              }
            : null,
        },
        parsed.data.goLiveDetails?.websiteUrl,
      );
    }

    revalidateWeBrandSchoolsAdmin();
    return {
      success: true,
      message: "Application status updated successfully.",
    };
  } catch (error) {
    console.error("[updateSchoolWebsiteApplicationStatus]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update application status.",
    };
  }
}

export async function deleteSchoolWebsiteApplication(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const application =
      await weBrandSchoolsPrisma.schoolWebsiteApplication.findUnique({
        where: { id },
        select: {
          id: true,
          schoolName: true,
          project: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!application) {
      return {
        success: false,
        message: "School website application was not found.",
      };
    }

    await weBrandSchoolsPrisma.schoolWebsiteApplication.delete({
      where: { id },
    });

    revalidateWeBrandSchoolsAdmin();

    return {
      success: true,
      message: application.project
        ? "Application and linked website project deleted successfully."
        : "Application deleted successfully.",
    };
  } catch (error) {
    console.error("[deleteSchoolWebsiteApplication]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete application.",
    };
  }
}

export async function deleteSchoolWebsiteApplications(
  ids: string[],
): Promise<ActionResult> {
  try {
    await requireAuth();

    if (!ids.length) {
      return { success: false, message: "No applications selected." };
    }

    await weBrandSchoolsPrisma.schoolWebsiteApplication.deleteMany({
      where: { id: { in: ids } },
    });

    revalidateWeBrandSchoolsAdmin();

    return {
      success: true,
      message: `Deleted ${ids.length} application${ids.length === 1 ? "" : "s"} successfully.`,
    };
  } catch (error) {
    console.error("[deleteSchoolWebsiteApplications]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete applications.",
    };
  }
}
