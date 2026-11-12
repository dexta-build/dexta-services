import { createElement } from "react";
import { sendTemplate } from "@/lib/email";
import { ReferralExpiryEmail } from "@/emails/schools";
import { weBrandSchoolsPrisma } from "@/lib/we-brand-schools-prisma";

type ReferralExpiryNotificationType =
  | "REFERRAL_EXPIRING_SOON"
  | "REFERRAL_EXPIRED";

type ReferralExpiryNotificationStatus = "SENT" | "FAILED" | "SKIPPED";

type ReferralExpiryRow = {
  id: string;
  slug: string;
  displayName: string;
  email: string;
  expiresAt: Date | null;
  notificationEnabled: boolean;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(value);
}

function getAdminRecipient() {
  const email = process.env.TEAM_EMAIL ?? process.env.SENDER_EMAIL;
  if (!email) return null;

  return {
    email,
    name: process.env.TEAM_NAME ?? process.env.SENDER_NAME ?? "Dexta Admin",
  };
}

function getPublicReferralUrl(referral: ReferralExpiryRow) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  return origin
    ? `${origin}/webrandschools/r/${referral.slug}`
    : `/webrandschools/r/${referral.slug}`;
}

async function hasSentReferralExpiryNotification({
  referralLinkId,
  type,
  recipientEmail,
}: {
  referralLinkId: string;
  type: ReferralExpiryNotificationType;
  recipientEmail: string;
}) {
  const existing = await weBrandSchoolsPrisma.referralNotificationLog.findFirst(
    {
      where: {
        referralLinkId,
        type,
        recipientEmail,
        status: "SENT",
      },
      select: { id: true },
    },
  );

  return Boolean(existing);
}

async function hasRecordedReferralExpiryNotification({
  referralLinkId,
  type,
  recipientEmail,
}: {
  referralLinkId: string;
  type: ReferralExpiryNotificationType;
  recipientEmail: string;
}) {
  const existing = await weBrandSchoolsPrisma.referralNotificationLog.findFirst(
    {
      where: {
        referralLinkId,
        type,
        recipientEmail,
        status: { in: ["SENT", "SKIPPED"] },
      },
      select: { id: true },
    },
  );

  return Boolean(existing);
}

async function logReferralExpiryNotification({
  referralLinkId,
  type,
  recipientEmail,
  subject,
  status,
  errorMessage,
  sentAt,
}: {
  referralLinkId: string;
  type: ReferralExpiryNotificationType;
  recipientEmail: string;
  subject: string;
  status: ReferralExpiryNotificationStatus;
  errorMessage?: string | null;
  sentAt?: Date | null;
}) {
  await weBrandSchoolsPrisma.referralNotificationLog.create({
    data: {
      referralLinkId,
      applicationId: null,
      type,
      recipientEmail,
      subject,
      status,
      errorMessage: errorMessage ?? null,
      sentAt: sentAt ?? null,
    },
  });
}

async function sendReferralExpiryNotification({
  referral,
  type,
  recipient,
  audience,
}: {
  referral: ReferralExpiryRow;
  type: ReferralExpiryNotificationType;
  recipient: { email: string; name?: string };
  audience: "owner" | "admin";
}) {
  if (!referral.expiresAt) return false;

  const alreadySent = await hasSentReferralExpiryNotification({
    referralLinkId: referral.id,
    type,
    recipientEmail: recipient.email,
  });
  if (alreadySent) return false;

  const isExpired = type === "REFERRAL_EXPIRED";
  const subject = isExpired
    ? `Referral link expired — ${referral.displayName}`
    : `Referral link expires soon — ${referral.displayName}`;
  const referralUrl = getPublicReferralUrl(referral);

  try {
    await sendTemplate({
      to: recipient,
      subject,
      email: createElement(ReferralExpiryEmail, {
        name: recipient.name ?? "there",
        expired: isExpired,
        displayName: referral.displayName,
        referralUrl,
        expires: formatDate(referral.expiresAt),
        forTeam: audience === "admin",
      }),
    });

    await logReferralExpiryNotification({
      referralLinkId: referral.id,
      type,
      recipientEmail: recipient.email,
      subject,
      status: "SENT",
      sentAt: new Date(),
    });
    return true;
  } catch (error) {
    await logReferralExpiryNotification({
      referralLinkId: referral.id,
      type,
      recipientEmail: recipient.email,
      subject,
      status: "FAILED",
      errorMessage:
        error instanceof Error ? error.message : "Unknown email failure.",
    });
    return false;
  }
}

async function processReferralExpiryNotificationForType({
  referral,
  type,
}: {
  referral: ReferralExpiryRow;
  type: ReferralExpiryNotificationType;
}) {
  let sent = 0;
  let skipped = 0;

  const admin = getAdminRecipient();
  const recipients: Array<{
    recipient: { email: string; name?: string };
    audience: "owner" | "admin";
  }> = [];

  if (referral.notificationEnabled && referral.email) {
    recipients.push({
      recipient: { email: referral.email, name: referral.displayName },
      audience: "owner",
    });
  } else {
    const recipientEmail = referral.email || "unknown";
    const alreadyRecorded = await hasRecordedReferralExpiryNotification({
      referralLinkId: referral.id,
      type,
      recipientEmail,
    });

    if (!alreadyRecorded) {
      await logReferralExpiryNotification({
        referralLinkId: referral.id,
        type,
        recipientEmail,
        subject:
          type === "REFERRAL_EXPIRED"
            ? `Referral link expired — ${referral.displayName}`
            : `Referral link expires soon — ${referral.displayName}`,
        status: "SKIPPED",
        errorMessage: referral.notificationEnabled
          ? "Referral owner email is missing."
          : "Referral notifications are disabled.",
      });
      skipped += 1;
    }
  }

  if (admin) {
    recipients.push({
      recipient: admin,
      audience: "admin",
    });
  }

  for (const item of recipients) {
    const delivered = await sendReferralExpiryNotification({
      referral,
      type,
      recipient: item.recipient,
      audience: item.audience,
    });
    if (delivered) {
      sent += 1;
    } else {
      skipped += 1;
    }
  }

  return { sent, skipped };
}

export async function processReferralExpiryNotifications(now = new Date()) {
  const warningWindowEnd = new Date(now.getTime() + 11 * 60 * 60 * 1000);

  const [expiringSoon, expired] = await Promise.all([
    weBrandSchoolsPrisma.referralLink.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        expiresAt: {
          gt: now,
          lte: warningWindowEnd,
        },
      },
      select: {
        id: true,
        slug: true,
        displayName: true,
        email: true,
        expiresAt: true,
        notificationEnabled: true,
      },
    }) as Promise<ReferralExpiryRow[]>,
    weBrandSchoolsPrisma.referralLink.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        expiresAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        slug: true,
        displayName: true,
        email: true,
        expiresAt: true,
        notificationEnabled: true,
      },
    }) as Promise<ReferralExpiryRow[]>,
  ]);

  let sent = 0;
  let skipped = 0;

  for (const referral of expiringSoon) {
    const result = await processReferralExpiryNotificationForType({
      referral,
      type: "REFERRAL_EXPIRING_SOON",
    });
    sent += result.sent;
    skipped += result.skipped;
  }

  for (const referral of expired) {
    const result = await processReferralExpiryNotificationForType({
      referral,
      type: "REFERRAL_EXPIRED",
    });
    sent += result.sent;
    skipped += result.skipped;
  }

  return {
    success: true,
    checkedAt: now.toISOString(),
    expiringSoonCount: expiringSoon.length,
    expiredCount: expired.length,
    sent,
    skipped,
  };
}
