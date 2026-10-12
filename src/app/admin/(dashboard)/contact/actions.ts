"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildEmailHtml, sendEmail } from "@/lib/email";
import {
  CONTACT_PAGE_CONTENT_DEFAULTS,
  parseJsonStringArray,
  parseLineList,
  type ContactPageContentData,
  type ContactSocialLinkData,
  type ContactSocialPlatform,
} from "@/lib/contact-defaults";
import { CONTACT_CONTENT_TAG, CONTACT_SOCIALS_TAG } from "@/lib/contact-cache";
import {
  contactPageContentSchema,
  contactReplySchema,
  contactSocialLinkSchema,
  type ContactPageContentInput,
  type ContactReplyInput,
  type ContactSocialLinkInput,
} from "@/lib/validators";

type ActionResult = {
  success: boolean;
  message: string;
};

type ContactPageContentDelegate = {
  findUnique: (args: { where: { id: number } }) => Promise<{
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
    emails: string;
    phoneLabel: string;
    phones: string;
    socialsLabel: string;
  } | null>;
  upsert: (args: {
    where: { id: number };
    update: Record<string, unknown>;
    create: { id: number } & Record<string, unknown>;
  }) => Promise<unknown>;
};

type ContactSocialLinkDelegate = {
  findMany: (
    args: Record<string, unknown>,
  ) => Promise<Array<Record<string, unknown>>>;
  findUnique: (
    args: Record<string, unknown>,
  ) => Promise<Record<string, unknown> | null>;
  findFirst: (
    args: Record<string, unknown>,
  ) => Promise<Record<string, unknown> | null>;
  create: (args: Record<string, unknown>) => Promise<unknown>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
  delete: (args: Record<string, unknown>) => Promise<unknown>;
};

type ContactMessageDelegate = {
  count: (args?: Record<string, unknown>) => Promise<number>;
  findMany: (
    args: Record<string, unknown>,
  ) => Promise<Array<Record<string, unknown>>>;
  findUnique: (
    args: Record<string, unknown>,
  ) => Promise<Record<string, unknown> | null>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
  delete: (args: Record<string, unknown>) => Promise<unknown>;
  deleteMany: (args?: Record<string, unknown>) => Promise<unknown>;
};

const CONTACT_MESSAGES_PER_PAGE = 10;

export type ContactPageContentRow = ContactPageContentData;

export type ContactSocialLinkRow = ContactSocialLinkData & {
  id: string;
};

export type ContactMessageRow = {
  id: number;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};

export type ContactMessagesPage = {
  items: ContactMessageRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  unreadCount: number;
  pageSize: number;
};

export type ContactAdminData = {
  content: ContactPageContentRow;
  socialLinks: ContactSocialLinkRow[];
  messages: ContactMessagesPage;
};

function revalidateContactContent() {
  updateTag(CONTACT_CONTENT_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/admin/contact");
}

function revalidateContactSocials() {
  updateTag(CONTACT_SOCIALS_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/admin/contact");
}

function revalidateContactInbox() {
  revalidatePath("/admin", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/contact");
}

async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }
}

function getTableMissingMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("does not exist")) {
    return "Contact tables are not in the database yet. Run `pnpm prisma:push` first.";
  }

  if (
    message.includes("reading 'upsert'") ||
    message.includes("reading 'findUnique'") ||
    message.includes("reading 'findMany'") ||
    message.includes("Contact models")
  ) {
    return "The running Prisma client does not include the Contact models yet. Run `pnpm prisma:generate`, restart the dev server, then run `pnpm prisma:push` if the tables are still missing.";
  }

  return fallback;
}

function getContactPageContentDelegate() {
  return (
    prisma as unknown as { contactPageContent?: ContactPageContentDelegate }
  ).contactPageContent;
}

function getContactSocialLinkDelegate() {
  return (
    prisma as unknown as { contactSocialLink?: ContactSocialLinkDelegate }
  ).contactSocialLink;
}

function getContactMessageDelegate() {
  return (prisma as unknown as { contactMessage?: ContactMessageDelegate })
    .contactMessage;
}

function getEmptyMessagesPage(page = 1): ContactMessagesPage {
  return {
    items: [],
    page,
    totalPages: 1,
    totalCount: 0,
    unreadCount: 0,
    pageSize: CONTACT_MESSAGES_PER_PAGE,
  };
}

function normalizeCount(
  value: bigint | number | string | null | undefined,
): number {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    return Number(value) || 0;
  }

  return value ?? 0;
}

function isContactReadStateUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("Unknown argument `isRead`") ||
    message.includes("Unknown argument `readAt`") ||
    (message.includes("isRead") && message.includes("does not exist")) ||
    (message.includes("readAt") && message.includes("does not exist")) ||
    message.includes('column "isRead" does not exist') ||
    message.includes('column "readAt" does not exist')
  );
}

async function getLegacyContactMessagesPage(
  contactMessage: ContactMessageDelegate,
  page: number,
): Promise<ContactMessagesPage> {
  const totalCount = await contactMessage.count();
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / CONTACT_MESSAGES_PER_PAGE),
  );
  const safePage = Math.min(page, totalPages);
  const items = (await contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * CONTACT_MESSAGES_PER_PAGE,
    take: CONTACT_MESSAGES_PER_PAGE,
    select: {
      id: true,
      name: true,
      email: true,
      message: true,
      createdAt: true,
    },
  })) as Array<{
    id: number;
    name: string;
    email: string;
    message: string;
    createdAt: Date;
  }>;

  return {
    items: items.map((item) => ({
      ...item,
      isRead: false,
      readAt: null,
    })),
    page: safePage,
    totalPages,
    totalCount,
    unreadCount: totalCount,
    pageSize: CONTACT_MESSAGES_PER_PAGE,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatReplyBody(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

async function getPrimaryContactInboxEmail() {
  try {
    const contactPageContent = getContactPageContentDelegate();

    if (!contactPageContent) {
      return CONTACT_PAGE_CONTENT_DEFAULTS.emails[0] ?? "info@dexta.services";
    }

    const row = await contactPageContent.findUnique({
      where: { id: 1 },
    });

    if (!row) {
      return CONTACT_PAGE_CONTENT_DEFAULTS.emails[0] ?? "info@dexta.services";
    }

    const emails = parseJsonStringArray(row.emails);
    return (
      emails[0] ??
      CONTACT_PAGE_CONTENT_DEFAULTS.emails[0] ??
      "info@dexta.services"
    );
  } catch {
    return CONTACT_PAGE_CONTENT_DEFAULTS.emails[0] ?? "info@dexta.services";
  }
}

function normalizeContactPageContent(data: ContactPageContentInput): Omit<
  ContactPageContentRow,
  "emails" | "phones"
> & {
  emails: string;
  phones: string;
} {
  return {
    homeEyebrow: data.homeEyebrow,
    homeTitle: data.homeTitle,
    homeBody: data.homeBody,
    homeCtaText: data.homeCtaText,
    homeCtaHref: data.homeCtaHref,
    heroEyebrow: data.heroEyebrow,
    heroTitle: data.heroTitle,
    heroBody: data.heroBody,
    infoEyebrow: data.infoEyebrow,
    infoTitle: data.infoTitle,
    infoBody: data.infoBody,
    formEyebrow: data.formEyebrow,
    formTitle: data.formTitle,
    formBody: data.formBody,
    addressLabel: data.addressLabel,
    address: data.address,
    emailLabel: data.emailLabel,
    emails: JSON.stringify(parseLineList(data.emailsText)),
    phoneLabel: data.phoneLabel,
    phones: JSON.stringify(parseLineList(data.phonesText)),
    socialsLabel: data.socialsLabel,
  };
}

export async function getContactPageContent(): Promise<ContactPageContentRow> {
  try {
    const contactPageContent = getContactPageContentDelegate();

    if (!contactPageContent) {
      throw new Error(
        "Contact models are missing from the running Prisma client.",
      );
    }

    const row = await contactPageContent.findUnique({
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
      emails: parseJsonStringArray(row.emails),
      phoneLabel: row.phoneLabel,
      phones: parseJsonStringArray(row.phones),
      socialsLabel: row.socialsLabel,
    };
  } catch {
    return CONTACT_PAGE_CONTENT_DEFAULTS;
  }
}

export async function getContactSocialLinks(): Promise<ContactSocialLinkRow[]> {
  try {
    const contactSocialLink = getContactSocialLinkDelegate();

    if (!contactSocialLink) {
      throw new Error(
        "Contact models are missing from the running Prisma client.",
      );
    }

    return (await contactSocialLink.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        platform: true,
        label: true,
        href: true,
        isVisible: true,
        position: true,
      },
    })) as ContactSocialLinkRow[];
  } catch {
    return [];
  }
}

export async function getContactMessages(
  rawPage = 1,
): Promise<ContactMessagesPage> {
  const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);
  const contactMessage = getContactMessageDelegate();

  if (!contactMessage) {
    return getEmptyMessagesPage();
  }

  try {
    const [totalRows, unreadRows] = await Promise.all([
      prisma.$queryRaw<Array<{ count: bigint | number | string }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM "ContactMessage"
      `),
      prisma.$queryRaw<Array<{ count: bigint | number | string }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM "ContactMessage"
        WHERE "isRead" = FALSE
      `),
    ]);

    const totalCount = normalizeCount(totalRows[0]?.count);
    const unreadCount = normalizeCount(unreadRows[0]?.count);
    const totalPages = Math.max(
      1,
      Math.ceil(totalCount / CONTACT_MESSAGES_PER_PAGE),
    );
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * CONTACT_MESSAGES_PER_PAGE;

    const items = await prisma.$queryRaw<ContactMessageRow[]>(Prisma.sql`
      SELECT
        "id",
        "name",
        "email",
        "message",
        "isRead",
        "readAt",
        "createdAt"
      FROM "ContactMessage"
      ORDER BY "createdAt" DESC
      OFFSET ${offset}
      LIMIT ${CONTACT_MESSAGES_PER_PAGE}
    `);

    return {
      items,
      page: safePage,
      totalPages,
      totalCount,
      unreadCount,
      pageSize: CONTACT_MESSAGES_PER_PAGE,
    };
  } catch (error) {
    if (!isContactReadStateUnavailableError(error)) {
      console.error("[Get Contact Messages]", error);
    }

    try {
      return await getLegacyContactMessagesPage(contactMessage, page);
    } catch (legacyError) {
      console.error("[Get Legacy Contact Messages]", legacyError);
      return getEmptyMessagesPage(page);
    }
  }
}

export async function getContactAdminData(page = 1): Promise<ContactAdminData> {
  const [content, socialLinks, messages] = await Promise.all([
    getContactPageContent(),
    getContactSocialLinks(),
    getContactMessages(page),
  ]);

  return { content, socialLinks, messages };
}

export async function updateContactPageContent(
  data: ContactPageContentInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = contactPageContentSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const normalizedData = normalizeContactPageContent(parsed.data);

    const contactPageContent = getContactPageContentDelegate();

    if (!contactPageContent) {
      throw new Error(
        "Contact models are missing from the running Prisma client.",
      );
    }

    await contactPageContent.upsert({
      where: { id: 1 },
      update: normalizedData,
      create: { id: 1, ...normalizedData },
    });

    revalidateContactContent();

    return {
      success: true,
      message: "Contact page content updated successfully.",
    };
  } catch (error) {
    console.error("[Update Contact Page Content]", error);

    return {
      success: false,
      message: getTableMissingMessage(
        error,
        error instanceof Error
          ? error.message
          : "Failed to update contact page content.",
      ),
    };
  }
}

export async function createContactSocialLink(
  data: ContactSocialLinkInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = contactSocialLinkSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const contactSocialLink = getContactSocialLinkDelegate();

    if (!contactSocialLink) {
      throw new Error(
        "Contact models are missing from the running Prisma client.",
      );
    }

    const existing = await contactSocialLink.findUnique({
      where: { platform: parsed.data.platform as ContactSocialPlatform },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        message:
          "That social platform already exists. Edit the existing one instead.",
      };
    }

    const lastItem = (await contactSocialLink.findFirst({
      orderBy: { position: "desc" },
      select: { position: true },
    })) as { position: number } | null;

    await contactSocialLink.create({
      data: {
        platform: parsed.data.platform as ContactSocialPlatform,
        label: parsed.data.label,
        href: parsed.data.href,
        position: (lastItem?.position ?? -1) + 1,
      },
    });

    revalidateContactSocials();

    return { success: true, message: "Social link added." };
  } catch (error) {
    console.error("[Create Contact Social Link]", error);

    return {
      success: false,
      message: getTableMissingMessage(
        error,
        error instanceof Error ? error.message : "Failed to add social link.",
      ),
    };
  }
}

export async function updateContactSocialLink(
  id: string,
  data: ContactSocialLinkInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = contactSocialLinkSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const contactSocialLink = getContactSocialLinkDelegate();

    if (!contactSocialLink) {
      throw new Error(
        "Contact models are missing from the running Prisma client.",
      );
    }

    const existing = await contactSocialLink.findFirst({
      where: {
        platform: parsed.data.platform as ContactSocialPlatform,
        id: { not: id },
      },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        message:
          "That social platform already exists. Choose another platform.",
      };
    }

    await contactSocialLink.update({
      where: { id },
      data: {
        platform: parsed.data.platform as ContactSocialPlatform,
        label: parsed.data.label,
        href: parsed.data.href,
      },
    });

    revalidateContactSocials();

    return { success: true, message: "Social link updated." };
  } catch (error) {
    console.error("[Update Contact Social Link]", error);

    return {
      success: false,
      message: getTableMissingMessage(
        error,
        error instanceof Error
          ? error.message
          : "Failed to update social link.",
      ),
    };
  }
}

export async function deleteContactSocialLink(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const contactSocialLink = getContactSocialLinkDelegate();

    if (!contactSocialLink) {
      throw new Error(
        "Contact models are missing from the running Prisma client.",
      );
    }

    await contactSocialLink.delete({
      where: { id },
    });

    revalidateContactSocials();

    return { success: true, message: "Social link removed." };
  } catch (error) {
    console.error("[Delete Contact Social Link]", error);

    return {
      success: false,
      message: getTableMissingMessage(
        error,
        error instanceof Error
          ? error.message
          : "Failed to remove social link.",
      ),
    };
  }
}

export async function moveContactSocialLink(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  try {
    await requireAuth();

    const contactSocialLink = getContactSocialLinkDelegate();

    if (!contactSocialLink) {
      throw new Error(
        "Contact models are missing from the running Prisma client.",
      );
    }

    const items = (await contactSocialLink.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        position: true,
      },
    })) as Array<{ id: string; position: number }>;

    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return { success: false, message: "Social link not found." };
    }

    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= items.length) {
      return { success: false, message: "Unable to move this social link." };
    }

    const current = items[index];
    const target = items[swapIndex];

    await prisma.$transaction([
      prisma.contactSocialLink.update({
        where: { id: current.id },
        data: { position: target.position },
      }),
      prisma.contactSocialLink.update({
        where: { id: target.id },
        data: { position: current.position },
      }),
    ]);

    revalidateContactSocials();

    return { success: true, message: "Social links reordered." };
  } catch (error) {
    console.error("[Move Contact Social Link]", error);

    return {
      success: false,
      message: getTableMissingMessage(
        error,
        error instanceof Error
          ? error.message
          : "Failed to reorder social links.",
      ),
    };
  }
}

export async function deleteContactMessage(id: number): Promise<ActionResult> {
  try {
    await requireAuth();

    const contactMessage = getContactMessageDelegate();

    if (!contactMessage) {
      throw new Error(
        "Contact models are missing from the running Prisma client.",
      );
    }

    await contactMessage.delete({
      where: { id },
    });

    revalidateContactInbox();

    return { success: true, message: "Message deleted." };
  } catch (error) {
    console.error("[Delete Contact Message]", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete contact message.",
    };
  }
}

export async function deleteContactMessages(
  ids: number[],
): Promise<ActionResult> {
  try {
    await requireAuth();

    if (!ids.length) {
      return { success: false, message: "No messages selected." };
    }

    const contactMessage = getContactMessageDelegate();

    if (!contactMessage) {
      throw new Error(
        "Contact models are missing from the running Prisma client.",
      );
    }

    await contactMessage.deleteMany({
      where: { id: { in: ids } },
    });

    revalidateContactInbox();

    return {
      success: true,
      message: `Deleted ${ids.length} message${ids.length === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    console.error("[Bulk Delete Contact Messages]", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete contact messages.",
    };
  }
}

export async function markContactMessageRead(
  id: number,
): Promise<ActionResult> {
  try {
    await requireAuth();

    await prisma.$executeRaw(Prisma.sql`
      UPDATE "ContactMessage"
      SET
        "isRead" = TRUE,
        "readAt" = COALESCE("readAt", NOW())
      WHERE "id" = ${id}
    `);

    revalidateContactInbox();

    return {
      success: true,
      message: "Message marked as read.",
    };
  } catch (error) {
    if (isContactReadStateUnavailableError(error)) {
      return {
        success: true,
        message: "Message opened.",
      };
    }

    console.error("[Mark Contact Message Read]", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update message status.",
    };
  }
}

export async function replyToContactMessage(
  id: number,
  data: ContactReplyInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = contactReplySchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const contactMessage = getContactMessageDelegate();

    if (!contactMessage) {
      throw new Error(
        "Contact models are missing from the running Prisma client.",
      );
    }

    const message = (await contactMessage.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
      },
    })) as { id: number; name: string; email: string; message: string } | null;

    if (!message) {
      return {
        success: false,
        message: "That contact message no longer exists.",
      };
    }

    const replyInboxEmail = await getPrimaryContactInboxEmail();

    await sendEmail({
      to: { email: message.email, name: message.name },
      subject: parsed.data.subject,
      replyTo: {
        email: replyInboxEmail,
        name: "Dexta Services",
      },
      htmlContent: buildEmailHtml({
        tag: "DEXTA REPLY",
        heading: parsed.data.subject,
        body: `
          <p style="color:#a0a0a0;font-size:14px;line-height:1.8;margin:0 0 20px;">
            Hi ${escapeHtml(message.name)},
          </p>
          <p style="color:#a0a0a0;font-size:14px;line-height:1.8;margin:0 0 20px;">
            ${formatReplyBody(parsed.data.body)}
          </p>
          <div style="margin-top:24px;padding:18px 20px;border:1px solid #333;border-radius:10px;background:#0a0a0a;">
            <p style="margin:0 0 8px;color:#666;font-size:11px;letter-spacing:2px;">YOUR ORIGINAL MESSAGE</p>
            <p style="margin:0;color:#d1d5db;font-size:13px;line-height:1.8;">
              ${formatReplyBody(message.message)}
            </p>
          </div>
          <p style="color:#a0a0a0;font-size:13px;line-height:1.8;margin:20px 0 0;">
            If you reply to this email, your response will go directly to ${escapeHtml(replyInboxEmail)}.
          </p>`,
      }),
    });

    try {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE "ContactMessage"
        SET
          "isRead" = TRUE,
          "readAt" = COALESCE("readAt", NOW())
        WHERE "id" = ${id}
      `);
    } catch (error) {
      if (!isContactReadStateUnavailableError(error)) {
        throw error;
      }
    }

    revalidateContactInbox();

    return {
      success: true,
      message: `Reply sent to ${message.email}.`,
    };
  } catch (error) {
    console.error("[Reply To Contact Message]", error);

    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to send reply.",
    };
  }
}
