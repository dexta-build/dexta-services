import Link from "next/link";
import { AuthHeading, FormAlert } from "@/components/admin/auth/parts";
import { SetPasswordForm } from "@/components/admin/auth/set-password-form";
import { Button } from "@/components/site/button";
import { checkResetToken, resetPassword } from "../../actions";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const reset = await checkResetToken(token);

  if (!reset) {
    return (
      <>
        <AuthHeading title="This link has *expired*" />
        <FormAlert>
          Reset links work once and only for 1 hour. Ask for a new one and use
          the latest email.
        </FormAlert>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button href="/admin/forgot-password">Send a new link</Button>
          <Link
            href="/admin/login"
            className="dx-link text-royal self-center text-sm font-bold"
          >
            Back to sign in
          </Link>
        </div>
      </>
    );
  }

  async function submit(input: { name: string; password: string }) {
    "use server";
    return resetPassword(token, input.password);
  }

  return (
    <>
      <AuthHeading
        title="Choose a new *password*"
        description="You'll be signed out everywhere else, then you can sign in with the new password."
      />
      <SetPasswordForm
        email={reset.email}
        submitLabel="Save new password"
        notice="reset"
        submit={submit}
      />
    </>
  );
}
