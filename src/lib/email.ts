import * as Brevo from "@getbrevo/brevo";

import { createElement } from "react";
import { render } from "@react-email/render";
import { SITE_URL } from "@/lib/site/site-url";
import {
  EventFullEmail,
  NewRegistrationEmail,
  RegistrationAcceptedEmail,
  RegistrationDeclinedEmail,
  RegistrationReceivedEmail,
  type EventDetails,
} from "@/emails/templates";

// ─── Brevo Client ────────────────────────────────────────────────────────────

function getBrevoClient() {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY!,
  );
  return apiInstance;
}

function getSender() {
  return {
    email: process.env.SENDER_EMAIL!,
    name: process.env.SENDER_NAME!,
  };
}

function getTeam() {
  return {
    email: process.env.TEAM_EMAIL!,
    name: process.env.TEAM_NAME!,
  };
}

// ─── Generic Send ────────────────────────────────────────────────────────────

export async function sendEmail({
  to,
  subject,
  htmlContent,
  replyTo,
}: {
  to: { email: string; name?: string };
  subject: string;
  htmlContent: string;
  replyTo?: { email: string; name?: string };
}) {
  const client = getBrevoClient();
  const email = new Brevo.SendSmtpEmail();
  email.subject = subject;
  email.sender = getSender();
  email.to = [to];
  email.htmlContent = htmlContent;
  if (replyTo) email.replyTo = replyTo;
  await client.sendTransacEmail(email);
}

// ─── Event emails (React Email templates in src/emails) ──────────────────────

export interface EventInfo {
  title: string;
  dateTime: Date;
  timezone: string;
  location: string;
}

function formatEventDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(date);
}

/** The event as the templates show it. */
export function eventDetails(event: EventInfo): EventDetails {
  return {
    title: event.title,
    when: formatEventDate(event.dateTime, event.timezone),
    where: event.location,
  };
}

/** The team's address, for replies and "questions?" lines. */
export function teamAddress() {
  return getTeam();
}

/** Sends a React Email template. */
export async function sendTemplate({
  to,
  subject,
  email,
  replyTo,
  attachments,
}: {
  to: { email: string; name?: string };
  subject: string;
  email: React.ReactElement;
  replyTo?: { email: string; name?: string };
  /** Real attachments: public file addresses the email service fetches. */
  attachments?: { url: string; name: string }[];
}) {
  const [htmlContent, textContent] = await Promise.all([
    render(email),
    render(email, { plainText: true }),
  ]);
  const client = getBrevoClient();
  const message = new Brevo.SendSmtpEmail();
  message.subject = subject.replace(/[\r\n]+/g, " ");
  message.sender = getSender();
  message.to = [to];
  message.htmlContent = htmlContent;
  message.textContent = textContent;
  if (replyTo) message.replyTo = replyTo;
  if (attachments?.length) message.attachment = attachments;
  await client.sendTransacEmail(message);
}

export async function sendPendingEmail(
  registration: { name: string; email: string },
  event: EventInfo,
) {
  await sendTemplate({
    to: { email: registration.email, name: registration.name },
    subject: `Registration received: ${event.title}`,
    replyTo: getTeam(),
    email: createElement(RegistrationReceivedEmail, {
      name: registration.name,
      event: eventDetails(event),
      teamEmail: getTeam().email,
    }),
  });
}

export async function sendAcceptanceEmail(
  registration: { name: string; email: string },
  event: EventInfo,
) {
  await sendTemplate({
    to: { email: registration.email, name: registration.name },
    subject: `You're in: ${event.title}`,
    replyTo: getTeam(),
    email: createElement(RegistrationAcceptedEmail, {
      name: registration.name,
      event: eventDetails(event),
      teamEmail: getTeam().email,
    }),
  });
}

export async function sendDeclineEmail(
  registration: { name: string; email: string },
  event: EventInfo,
  reason?: string,
) {
  await sendTemplate({
    to: { email: registration.email, name: registration.name },
    subject: `An update on your registration: ${event.title}`,
    replyTo: getTeam(),
    email: createElement(RegistrationDeclinedEmail, {
      name: registration.name,
      event: eventDetails(event),
      reason,
      teamEmail: getTeam().email,
    }),
  });
}

export async function sendEventFullEmail(
  registrations: { name: string; email: string }[],
  event: EventInfo,
) {
  for (const reg of registrations) {
    try {
      await sendTemplate({
        to: { email: reg.email, name: reg.name },
        subject: `${event.title} is fully booked`,
        replyTo: getTeam(),
        email: createElement(EventFullEmail, {
          name: reg.name,
          event: eventDetails(event),
        }),
      });
    } catch {
      console.error(`[Event Full Email] Failed for ${reg.email}`);
    }
  }
}

export async function sendTeamNotificationEmail(
  registration: {
    name: string;
    email: string;
    formData: Record<string, string>;
  },
  event: EventInfo,
) {
  const team = getTeam();
  await sendTemplate({
    to: { email: team.email, name: team.name },
    subject: `New registration for ${event.title}: ${registration.name}`,
    replyTo: { email: registration.email, name: registration.name },
    email: createElement(NewRegistrationEmail, {
      name: registration.name,
      email: registration.email,
      event: eventDetails(event),
      answers: Object.entries(registration.formData).map(([label, value]) => ({
        label,
        value,
      })),
      adminUrl: `${SITE_URL}/admin/inbox`,
    }),
  });
}
