import {
  Files,
  RichBody,
  type LinkedFile,
  Details,
  EmailButton,
  EmailLayout,
  EventCard,
  Heading,
  Muted,
  Para,
  Quoted,
} from "./layout";

/**
 * The site's emails, as React Email components. Rendered to HTML in
 * src/lib/email.ts (and for the admin's previews).
 */

export type EventDetails = { title: string; when: string; where: string };

const first = (name: string) => name.trim().split(/\s+/)[0] || "there";

/** A reply typed in the admin inbox. */
export function ReplyEmail({
  html,
  preview,
  quote,
  files,
}: {
  /** Email-safe HTML (src/lib/email-html.ts). */
  html: string;
  preview: string;
  quote?: { label: string; text: string };
  /** Files sent as download links. */
  files?: LinkedFile[];
}) {
  return (
    <EmailLayout preview={preview}>
      <RichBody html={html} />
      {files && files.length > 0 && <Files files={files} />}
      {quote && <Quoted label={quote.label} text={quote.text} />}
    </EmailLayout>
  );
}

/** An announcement to an event's attendees (tags already filled in). */
export function AnnouncementEmail({
  html,
  preview,
  event,
  eventUrl,
  files,
}: {
  /** Email-safe HTML with tags filled in (src/lib/email-html.ts). */
  html: string;
  preview: string;
  event?: EventDetails;
  eventUrl?: string;
  files?: LinkedFile[];
}) {
  return (
    <EmailLayout preview={preview} eyebrow={event?.title}>
      <RichBody html={html} />
      {files && files.length > 0 && <Files files={files} />}
      {event && <EventCard {...event} />}
      {eventUrl && <EmailButton href={eventUrl}>Event details</EmailButton>}
    </EmailLayout>
  );
}

export function RegistrationReceivedEmail({
  name,
  event,
  teamEmail,
  payment,
}: {
  name: string;
  event: EventDetails;
  teamEmail: string;
  payment?: { price: string; link: string };
}) {
  return (
    <EmailLayout
      preview={`We've got your registration for ${event.title}`}
      eyebrow="Registration received"
    >
      <Heading>Thanks, {first(name)}!</Heading>
      <Para>
        We&apos;ve received your registration for <strong>{event.title}</strong>
        . Our team will review it and email you to confirm your seat.
      </Para>
      <EventCard {...event} />
      {payment && (
        <>
          <Para>
            This is a paid event (<strong>{payment.price}</strong>). If you
            haven&apos;t paid yet, pay now to secure your seat.
          </Para>
          <EmailButton href={payment.link}>Pay {payment.price}</EmailButton>
        </>
      )}
      <Muted>Questions? Write to us at {teamEmail}.</Muted>
    </EmailLayout>
  );
}

export function RegistrationAcceptedEmail({
  name,
  event,
  teamEmail,
  payment,
}: {
  name: string;
  event: EventDetails;
  teamEmail: string;
  payment?: { price: string; link: string };
}) {
  return (
    <EmailLayout
      preview={`Your seat at ${event.title} is confirmed`}
      eyebrow="You're in"
    >
      <Heading>You&apos;re in, {first(name)}!</Heading>
      <Para>
        Great news: your registration for <strong>{event.title}</strong> has
        been accepted. We can&apos;t wait to see you there.
      </Para>
      <EventCard {...event} />
      {payment && (
        <>
          <Para>
            This is a paid event (<strong>{payment.price}</strong>). If you
            haven&apos;t paid yet, pay now to secure your seat.
          </Para>
          <EmailButton href={payment.link}>Pay {payment.price}</EmailButton>
        </>
      )}
      <Muted>
        Add it to your calendar so you don&apos;t miss it. Questions? Write to
        us at {teamEmail}.
      </Muted>
    </EmailLayout>
  );
}

export function RegistrationDeclinedEmail({
  name,
  event,
  reason,
  teamEmail,
}: {
  name: string;
  event: EventDetails;
  reason?: string;
  teamEmail: string;
}) {
  return (
    <EmailLayout
      preview={`An update on your registration for ${event.title}`}
      eyebrow="Registration update"
    >
      <Heading>Hi {first(name)},</Heading>
      <Para>
        Thank you for your interest in <strong>{event.title}</strong>.
        Unfortunately we can&apos;t offer you a seat this time.
      </Para>
      {reason && (
        <Para>
          <strong>Why:</strong> {reason}
        </Para>
      )}
      <Para>We hope to see you at a future event.</Para>
      <Muted>Questions? Write to us at {teamEmail}.</Muted>
    </EmailLayout>
  );
}

export function EventFullEmail({
  name,
  event,
}: {
  name: string;
  event: EventDetails;
}) {
  return (
    <EmailLayout
      preview={`${event.title} is fully booked`}
      eyebrow="Fully booked"
    >
      <Heading>Hi {first(name)},</Heading>
      <Para>
        Thank you for registering for <strong>{event.title}</strong>. It&apos;s
        now fully booked, so we can&apos;t confirm your seat.
      </Para>
      <Para>We&apos;ll let you know about our next events first.</Para>
    </EmailLayout>
  );
}

/** To the team when someone registers. */
export function NewRegistrationEmail({
  name,
  email,
  event,
  answers,
  adminUrl,
}: {
  name: string;
  email: string;
  event: EventDetails;
  answers: { label: string; value: string }[];
  adminUrl: string;
}) {
  return (
    <EmailLayout
      preview={`${name} registered for ${event.title}`}
      eyebrow="New registration"
    >
      <Heading>{name} registered</Heading>
      <EventCard {...event} />
      <Details
        rows={[
          { label: "Name", value: name },
          { label: "Email", value: email },
          ...answers,
        ]}
      />
      <EmailButton href={adminUrl}>Review in the inbox</EmailButton>
    </EmailLayout>
  );
}

/** To a teammate who's been assigned inbox items. */
export function AssignedEmail({
  assigner,
  what,
  url,
}: {
  assigner: string;
  what: string;
  url: string;
}) {
  return (
    <EmailLayout preview={`${assigner} assigned you ${what}`} eyebrow="Inbox">
      <Heading>You&apos;ve been assigned {what}</Heading>
      <Para>
        {assigner} assigned you {what} in the Dexta admin inbox.
      </Para>
      <EmailButton href={url}>Open your inbox</EmailButton>
    </EmailLayout>
  );
}
