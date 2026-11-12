"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { TextField } from "@/components/admin/kit/fields";
import {
  AuthHeading,
  FormAlert,
  SubmitButton,
} from "@/components/admin/auth/parts";
import { requestPasswordReset } from "../actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const token = executeRecaptcha
        ? await executeRecaptcha("forgot_password")
        : undefined;
      const res = await requestPasswordReset(email, token);
      if (res.success) setSent(true);
      else setError(res.message ?? "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <AuthHeading
        title="Forgot your *password*?"
        description="Enter the email you sign in with and we'll send you a link to choose a new one."
      />
      {sent ? (
        <FormAlert tone="success">
          If <strong>{email}</strong> has an account, a reset link is on its
          way. It works for 1 hour. Check your spam folder if it doesn&apos;t
          arrive.
        </FormAlert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <FormAlert>{error}</FormAlert>}
          <SubmitButton pending={pending} pendingLabel="Sending link">
            Send reset link
          </SubmitButton>
        </form>
      )}
      <Link
        href="/admin/login"
        className="text-royal mt-8 inline-flex items-center gap-1.5 text-sm font-bold"
      >
        <ArrowLeft aria-hidden className="size-4" />
        <span className="dx-link">Back to sign in</span>
      </Link>
    </>
  );
}
