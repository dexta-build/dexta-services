import Link from "next/link";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import { AuthHeading, FormAlert } from "@/components/admin/auth/parts";
import { SetPasswordForm } from "@/components/admin/auth/set-password-form";
import { acceptInvite, checkInviteToken } from "../../actions";

export const metadata = { title: "Accept invite" };

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await checkInviteToken(token);

  if (!invite) {
    return (
      <>
        <AuthHeading title="This invite has *expired*" />
        <FormAlert>
          Invites work once and only for 7 days. Ask the person who invited you
          to send a new one.
        </FormAlert>
        <Link
          href="/admin/login"
          className="dx-link text-royal mt-6 inline-block text-sm font-bold"
        >
          Go to sign in
        </Link>
      </>
    );
  }

  async function submit(input: { name: string; password: string }) {
    "use server";
    return acceptInvite(token, input);
  }

  return (
    <>
      <AuthHeading
        title="Join the *Dexta* admin"
        description={`You've been invited as an ${ROLE_LABELS[invite.role]}. Set your name and a password to finish.`}
      />
      <SetPasswordForm
        email={invite.email}
        askName
        defaultName={invite.name}
        submitLabel="Create my account"
        notice="invited"
        submit={submit}
      />
    </>
  );
}
