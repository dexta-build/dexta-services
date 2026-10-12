"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { contactFormSchema, ContactFormState } from "@/lib/validators";
import prisma from "@/lib/prisma";
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
  CONTACT_PAGE_CONTENT_DEFAULTS,
  parseJsonStringArray,
} from "@/lib/contact-defaults";
import * as brevo from "@getbrevo/brevo";

const brevoApiKey = process.env.BREVO_API_KEY;
if (!brevoApiKey) {
  throw new Error("Missing BREVO_API_KEY environment variable");
}
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function getContactNotificationEmail() {
  try {
    const row = await prisma.contactPageContent.findUnique({
      where: { id: 1 },
      select: { emails: true },
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

function buildAdminContactEmailHtml({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <div style="border:1px solid #1f2937;border-radius:18px;background:#111827;padding:28px;">
        <p style="margin:0 0 10px;color:#00abff;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;">
          New Contact Message
        </p>
        <h1 style="margin:0 0 20px;color:#ffffff;font-size:26px;line-height:1.2;">
          Someone contacted Dexta
        </h1>
        <div style="border:1px solid #243040;border-radius:14px;background:#0b1220;padding:18px 20px;margin-bottom:18px;">
          <p style="margin:0 0 8px;color:#8ca3bf;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
            Sender
          </p>
          <p style="margin:0;color:#ffffff;font-size:16px;font-weight:600;">${safeName}</p>
          <p style="margin:8px 0 0;color:#c8d5e5;font-size:14px;">
            <a href="mailto:${safeEmail}" style="color:#7dd3fc;text-decoration:none;">${safeEmail}</a>
          </p>
        </div>
        <div style="border:1px solid #243040;border-radius:14px;background:#0b1220;padding:18px 20px;">
          <p style="margin:0 0 8px;color:#8ca3bf;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
            Message
          </p>
          <p style="margin:0;color:#e5eef8;font-size:14px;line-height:1.8;">${safeMessage}</p>
        </div>
        <p style="margin:18px 0 0;color:#8ca3bf;font-size:12px;line-height:1.7;">
          This message was also saved in the admin contact inbox.
        </p>
      </div>
    </div>
  </body>
</html>`;
}

function buildContactConfirmationEmailHtml({ name }: { name: string }) {
  const safeName = escapeHtml(name);

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <div style="border:1px solid #1f2937;border-radius:18px;background:#111827;padding:28px;">
        <p style="margin:0 0 10px;color:#00abff;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;">
          Message Received
        </p>
        <h1 style="margin:0 0 20px;color:#ffffff;font-size:26px;line-height:1.2;">
          We have received your message
        </h1>
        <p style="margin:0 0 16px;color:#e5eef8;font-size:14px;line-height:1.8;">
          Hi ${safeName},
        </p>
        <p style="margin:0 0 16px;color:#c8d5e5;font-size:14px;line-height:1.8;">
          We have received your message and our team will get back to you shortly.
        </p>
        <p style="margin:0;color:#c8d5e5;font-size:14px;line-height:1.8;">
          Thank you for reaching out to Dexta.
        </p>
      </div>
    </div>
  </body>
</html>`;
}

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Rate limit by IP
  const headersList = await headers();
  const ip = getClientIp(headersList);

  // 1. Honeypot check: Bots auto-fill all form fields including hidden traps
  const honeypot = formData.get("company_title");
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    recordSpamAlert({
      formName: "contact",
      reason: "honeypot",
      ip,
      details: { trapValue: honeypot },
    });
    return {
      success: true,
      message: "Thank you! Your message has been sent successfully.",
    };
  }

  // 2. Timing check: Headless bots submit instantaneously (< 1500ms)
  const formTsRaw = formData.get("_form_ts");
  if (formTsRaw && typeof formTsRaw === "string") {
    const elapsed = Date.now() - Number(formTsRaw);
    if (!Number.isNaN(elapsed) && elapsed > 0 && elapsed < 1500) {
      recordSpamAlert({
        formName: "contact",
        reason: "timing",
        ip,
        details: { elapsedMs: elapsed },
      });
      return {
        success: true,
        message: "Thank you! Your message has been sent successfully.",
      };
    }
  }

  const limit = rateLimit(`contact:${ip}`, RATE_LIMITS.contact);
  if (!limit.success) {
    recordSpamAlert({
      formName: "contact",
      reason: "rate_limit",
      ip,
      details: { resetMs: limit.resetMs },
    });
    const waitTime = formatRateLimitWaitTime(limit.resetMs);
    return {
      success: false,
      message: `Too many submissions from this connection. Please wait ${waitTime} before trying again.`,
    };
  }

  const validatedFields = contactFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Verify reCAPTCHA v3
  const recaptchaToken = formData.get("recaptchaToken") as string;
  if (
    process.env.RECAPTCHA_SECRET_KEY &&
    !recaptchaToken &&
    process.env.NODE_ENV === "production"
  ) {
    return {
      success: false,
      message:
        "Security verification failed (missing token). Please refresh and try again.",
    };
  }

  if (recaptchaToken) {
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, "contact");
    if (!recaptchaResult.success) {
      return {
        success: false,
        message: "reCAPTCHA verification failed. Please try again.",
      };
    }
  }

  try {
    await prisma.contactMessage.create({
      data: {
        name: validatedFields.data.name,
        email: validatedFields.data.email,
        message: validatedFields.data.message,
      },
    });

    revalidatePath("/admin", "layout");
    revalidatePath("/admin");
    revalidatePath("/admin/contact");

    const adminNotificationEmail = await getContactNotificationEmail();

    const confirmationEmail = new brevo.SendSmtpEmail();
    confirmationEmail.to = [
      { email: validatedFields.data.email, name: validatedFields.data.name },
    ];
    confirmationEmail.subject = "We have received your message";
    confirmationEmail.sender = {
      name: process.env.SENDER_NAME!,
      email: process.env.SENDER_EMAIL!,
    };
    confirmationEmail.htmlContent = buildContactConfirmationEmailHtml({
      name: validatedFields.data.name,
    });

    const adminEmail = new brevo.SendSmtpEmail();
    adminEmail.to = [
      { email: adminNotificationEmail, name: "Dexta Contact Inbox" },
    ];
    adminEmail.subject = `New contact message from ${validatedFields.data.name}`;
    adminEmail.sender = {
      name: process.env.SENDER_NAME!,
      email: process.env.SENDER_EMAIL!,
    };
    adminEmail.replyTo = {
      email: validatedFields.data.email,
      name: validatedFields.data.name,
    };
    adminEmail.htmlContent = buildAdminContactEmailHtml({
      name: validatedFields.data.name,
      email: validatedFields.data.email,
      message: validatedFields.data.message,
    });

    const emailsToSend = [apiInstance.sendTransacEmail(confirmationEmail)];
    if (shouldSendNotification("contact-admin", 30_000, 10)) {
      emailsToSend.push(apiInstance.sendTransacEmail(adminEmail));
    } else {
      console.warn(
        "[Contact Notification Throttled] Admin email alert throttled to protect inbox from spam flood.",
      );
    }

    const emailResults = await Promise.allSettled(emailsToSend);

    for (const result of emailResults) {
      if (result.status === "rejected") {
        console.error("[Contact Email Delivery Failed]", result.reason);
      }
    }

    return {
      success: true,
      message: "Your message has been sent successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    };
  }
}
