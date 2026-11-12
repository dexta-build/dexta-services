import "server-only";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site/site-url";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** The address links in admin emails point to (this request's host in dev). */
export async function adminOrigin() {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") ??
        (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // Outside a request: fall through.
  }
  return SITE_URL;
}

/** A light, on-brand email with one button. */
function buildAdminEmail({
  heading,
  intro,
  buttonLabel,
  url,
  note,
}: {
  heading: string;
  intro: string;
  buttonLabel: string;
  url: string;
  note: string;
}) {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f8f8f5;font-family:'Helvetica Neue',Arial,sans-serif;color:#202321;">
    <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
      <div style="background:#ffffff;border-radius:14px;padding:36px 32px;">
        <p style="margin:0 0 24px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#000c99;">Dexta admin</p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;letter-spacing:-0.02em;color:#202321;">${escapeHtml(heading)}</h1>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#5d615d;">${escapeHtml(intro)}</p>
        <a href="${url}" style="display:inline-block;background:#000c99;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:999px;">${escapeHtml(buttonLabel)}</a>
        <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#737773;">${escapeHtml(note)}</p>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#737773;word-break:break-all;">Or paste this link into your browser:<br>${url}</p>
      </div>
      <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#737773;">Dexta Synergy Services</p>
    </div>
  </body>
</html>`;
}

async function deliver(
  to: { email: string; name?: string },
  subject: string,
  html: string,
  url: string,
) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[admin email] ${subject} → ${to.email}\n${url}`);
  }
  try {
    await sendEmail({ to, subject, htmlContent: html });
    return true;
  } catch (error) {
    console.error("[admin email] could not send:", (error as Error).message);
    return false;
  }
}

export async function sendInviteEmail({
  email,
  name,
  inviterName,
  roleLabel,
  token,
}: {
  email: string;
  name?: string | null;
  inviterName: string;
  roleLabel: string;
  token: string;
}) {
  const url = `${await adminOrigin()}/admin/invite/${token}`;
  return deliver(
    { email, name: name ?? undefined },
    "You're invited to the Dexta admin",
    buildAdminEmail({
      heading: name
        ? `${name.split(" ")[0]}, you're invited`
        : "You're invited",
      intro: `${inviterName} has invited you to help manage the Dexta website as an ${roleLabel}. Set your name and password to get started.`,
      buttonLabel: "Accept invite",
      url,
      note: "This invite works once and expires in 7 days. If you weren't expecting it, you can ignore this email.",
    }),
    url,
  );
}

export async function sendResetEmail({
  email,
  name,
  token,
}: {
  email: string;
  name: string;
  token: string;
}) {
  const url = `${await adminOrigin()}/admin/reset-password/${token}`;
  return deliver(
    { email, name },
    "Reset your Dexta admin password",
    buildAdminEmail({
      heading: "Reset your password",
      intro: `Hi ${name.split(" ")[0]}, someone (hopefully you) asked to reset the password for your Dexta admin account.`,
      buttonLabel: "Choose a new password",
      url,
      note: "This link works once and expires in 1 hour. If you didn't ask for this, ignore this email: your password won't change.",
    }),
    url,
  );
}
