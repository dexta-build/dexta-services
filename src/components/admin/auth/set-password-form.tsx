"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/admin/kit/fields";
import { PASSWORD_HINT, passwordSchema } from "@/lib/admin/passwords";
import { FormAlert, PasswordField, SubmitButton } from "./parts";

/**
 * Choose a password (reset) or a name and password (accepting an invite).
 * `submit` is the server action; on success we go to sign in.
 */
export function SetPasswordForm({
  email,
  askName,
  defaultName = "",
  submitLabel,
  notice,
  submit,
}: {
  email: string;
  askName?: boolean;
  defaultName?: string;
  submitLabel: string;
  notice: "reset" | "invited";
  submit: (input: {
    name: string;
    password: string;
  }) => Promise<{ success: boolean; message?: string }>;
}) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (askName && name.trim().length < 2) next.name = "Enter your name.";
    const p = passwordSchema.safeParse(password);
    if (!p.success) next.password = p.error.issues[0]?.message;
    if (confirm !== password) next.confirm = "The passwords don't match.";
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setPending(true);
    try {
      const res = await submit({ name: name.trim(), password });
      if (res.success) {
        router.replace(`/admin/login?notice=${notice}`);
        return;
      }
      setFormError(res.message ?? "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <TextField
        label="Email"
        type="email"
        value={email}
        readOnly
        disabled
        autoComplete="username"
      />
      {askName && (
        <TextField
          label="Your name"
          autoComplete="name"
          autoFocus
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
      )}
      <PasswordField
        label="New password"
        autoComplete="new-password"
        autoFocus={!askName}
        required
        hint={PASSWORD_HINT}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />
      {formError && <FormAlert>{formError}</FormAlert>}
      <SubmitButton pending={pending} pendingLabel="Saving">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
