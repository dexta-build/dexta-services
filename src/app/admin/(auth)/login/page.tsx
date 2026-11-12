"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { signIn } from "next-auth/react";
import { loginSchema, type LoginFormData } from "@/lib/validators";
import { TextField } from "@/components/admin/kit/fields";
import {
  AuthHeading,
  FormAlert,
  PasswordField,
  SubmitButton,
} from "@/components/admin/auth/parts";
import { verifyLoginRequest } from "../actions";

/** Only send people back to admin pages after signing in. */
function safeCallback(value: string | null) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//"))
    return "/admin";
  if (value.startsWith("/admin/login")) return "/admin";
  return value;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallback(params.get("callbackUrl"));
  const notice = params.get("notice");
  const [error, setError] = useState<string | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      setError(null);
      const token = executeRecaptcha
        ? await executeRecaptcha("login")
        : undefined;
      const check = await verifyLoginRequest(data.email, token);
      if (!check.success) {
        setError(check.message ?? "We couldn't sign you in. Please try again.");
        return;
      }
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (!result || result.error) {
        setError("That email and password don't match an active account.");
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    },
    [executeRecaptcha, router, callbackUrl],
  );

  return (
    <>
      <AuthHeading
        title="Welcome *back*"
        description="Sign in to manage the Dexta website."
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        {notice === "reset" && (
          <FormAlert tone="success">
            Your password was changed. Sign in with the new one.
          </FormAlert>
        )}
        {notice === "invited" && (
          <FormAlert tone="success">
            Your account is ready. Sign in to get started.
          </FormAlert>
        )}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          error={errors.email?.message}
          {...register("email")}
        />
        <div className="flex flex-col gap-2">
          <PasswordField
            label="Password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Link
            href="/admin/forgot-password"
            className="dx-link text-royal self-end text-sm font-bold"
          >
            Forgot password?
          </Link>
        </div>
        {error && <FormAlert>{error}</FormAlert>}
        <SubmitButton pending={isSubmitting} pendingLabel="Signing in">
          Sign in
        </SubmitButton>
      </form>
      <p className="text-surface-muted mt-8 text-center text-xs leading-relaxed">
        This area is for the Dexta team. Sign-ins are recorded.
      </p>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
