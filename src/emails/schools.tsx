import {
  Details,
  EmailButton,
  EmailLayout,
  Heading,
  Muted,
  Para,
} from "./layout";

/** We Brand Schools emails, sent from the admin. */

export function SchoolSiteLiveEmail({
  schoolName,
  projectName,
  templateName,
  liveUrl,
  portalUrl,
  portalPassword,
  wentLive,
  message,
}: {
  schoolName: string;
  projectName: string;
  templateName: string;
  liveUrl: string | null;
  portalUrl: string;
  portalPassword: string;
  wentLive: string;
  message: string;
}) {
  return (
    <EmailLayout
      preview={`${schoolName}'s new website is live`}
      eyebrow="We Brand Schools"
    >
      <Heading>Your school website is live</Heading>
      <Para>
        Good news: the Dexta team has put <strong>{schoolName}</strong>&apos;s
        new website online. Here&apos;s everything you need.
      </Para>
      {liveUrl && <EmailButton href={liveUrl}>Visit your website</EmailButton>}
      <Details
        rows={[
          { label: "Website", value: liveUrl ?? "Not set yet" },
          { label: "Portal address", value: portalUrl },
          { label: "Portal password", value: portalPassword },
          { label: "Project", value: projectName },
          { label: "Template", value: templateName },
          { label: "Went live", value: wentLive },
        ]}
      />
      {message && <Para>{message}</Para>}
      <Muted>
        Thank you for working with Dexta. Reply to this email if you need help
        or any corrections.
      </Muted>
    </EmailLayout>
  );
}

export function ReferralSiteLiveEmail({
  name,
  schoolName,
  projectName,
  templateName,
  liveUrl,
  wentLive,
  referralPath,
}: {
  name: string;
  schoolName: string;
  projectName: string;
  templateName: string;
  liveUrl: string | null;
  wentLive: string;
  referralPath: string;
}) {
  return (
    <EmailLayout
      preview={`${schoolName}, a school you referred, is now live`}
      eyebrow="Your referral"
    >
      <Heading>A school you referred is live</Heading>
      <Para>
        Hello {name}, <strong>{schoolName}</strong> applied through your
        referral link, and their We Brand Schools website is now online.
      </Para>
      {liveUrl && <EmailButton href={liveUrl}>See their website</EmailButton>}
      <Details
        rows={[
          { label: "School", value: schoolName },
          { label: "Website", value: liveUrl ?? "Not set yet" },
          { label: "Project", value: projectName },
          { label: "Template", value: templateName },
          { label: "Went live", value: wentLive },
          { label: "Your link", value: referralPath },
        ]}
      />
      <Muted>
        Thank you for connecting this school with Dexta. This launch is recorded
        under your referral link.
      </Muted>
    </EmailLayout>
  );
}

export function ReferralExpiryEmail({
  name,
  expired,
  displayName,
  referralUrl,
  expires,
  forTeam,
}: {
  name: string;
  expired: boolean;
  displayName: string;
  referralUrl: string;
  expires: string;
  /** The copy the team gets, rather than the link's owner. */
  forTeam: boolean;
}) {
  return (
    <EmailLayout
      preview={
        expired
          ? `${displayName}'s referral link has ended`
          : `${displayName}'s referral link ends soon`
      }
      eyebrow="Referral link"
    >
      <Heading>
        {expired ? "A referral link has ended" : "A referral link ends soon"}
      </Heading>
      <Para>Hello {name},</Para>
      <Para>
        {expired
          ? "This referral link has reached its end date, so new visitors are no longer credited to it."
          : "This referral link ends soon. After the time below, new visitors won't be credited to it."}
      </Para>
      <Details
        rows={[
          { label: "Name or organisation", value: displayName },
          { label: "Link", value: referralUrl },
          { label: expired ? "Ended" : "Ends", value: expires },
          {
            label: "Sent to",
            value: forTeam ? "The Dexta team" : "The link's owner",
          },
        ]}
      />
      <Muted>
        Applications already sent keep their referral. Only new visits are
        affected.
      </Muted>
    </EmailLayout>
  );
}

export function SchoolApplicationReceivedEmail({
  schoolName,
  templateName,
  submitted,
}: {
  schoolName: string;
  templateName: string;
  submitted: string;
}) {
  return (
    <EmailLayout
      preview={`We've got ${schoolName}'s website request`}
      eyebrow="We Brand Schools"
    >
      <Heading>We&apos;ve got your request</Heading>
      <Para>
        Thank you. Your We Brand Schools application has reached us, and our
        team will review it shortly.
      </Para>
      <Details
        rows={[
          { label: "School", value: schoolName },
          { label: "Template", value: templateName },
          { label: "Sent", value: submitted },
        ]}
      />
      <Muted>
        We&apos;ll get in touch if we need anything else, and you&apos;ll hear
        from us again when your website goes live.
      </Muted>
    </EmailLayout>
  );
}

export function ReferralUsedEmail({
  name,
  schoolName,
  templateName,
  submitted,
  referralUrl,
}: {
  name: string;
  schoolName: string;
  templateName: string;
  submitted: string;
  referralUrl: string;
}) {
  return (
    <EmailLayout
      preview={`${schoolName} applied through your referral link`}
      eyebrow="Your referral"
    >
      <Heading>Your referral link was used</Heading>
      <Para>
        Hello {name}, <strong>{schoolName}</strong> just applied for a We Brand
        Schools website through your referral link.
      </Para>
      <Details
        rows={[
          { label: "School", value: schoolName },
          { label: "Template", value: templateName },
          { label: "Sent", value: submitted },
          { label: "Your link", value: referralUrl },
        ]}
      />
      <Muted>We&apos;ll let you know again when their website goes live.</Muted>
    </EmailLayout>
  );
}
