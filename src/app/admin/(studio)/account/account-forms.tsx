"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/kit/layout";
import { TextField } from "@/components/admin/kit/fields";
import { PasswordField } from "@/components/admin/auth/parts";
import { Button } from "@/components/site/button";
import { PASSWORD_HINT, passwordSchema } from "@/lib/admin/passwords";
import { changeMyPassword, updateMyName } from "./actions";

export function AccountForms({
  name: initialName,
  email,
}: {
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{
    next?: string;
    confirm?: string;
    current?: string;
  }>({});
  const [savingName, startName] = useTransition();
  const [savingPassword, startPassword] = useTransition();

  const saveName = (e: React.FormEvent) => {
    e.preventDefault();
    startName(async () => {
      const res = await updateMyName(name);
      if (res.success) {
        toast.success(res.message ?? "Saved");
        router.refresh();
      } else toast.error(res.message ?? "Couldn't save.");
    });
  };

  const savePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!current) errs.current = "Enter your current password.";
    const p = passwordSchema.safeParse(next);
    if (!p.success) errs.next = p.error.issues[0]?.message;
    if (confirm !== next) errs.confirm = "The passwords don't match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    startPassword(async () => {
      const res = await changeMyPassword(current, next);
      if (!res.success) {
        setErrors({ current: res.message });
        return;
      }
      toast.success("Password changed. Sign in again with the new one.");
      await signOut({ callbackUrl: "/admin/login?notice=reset" });
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminCard
        title="Profile"
        description="Your name is shown in the activity log."
      >
        <form onSubmit={saveName} className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Email"
              value={email}
              disabled
              readOnly
              hint="Ask an Admin to change it."
            />
          </div>
          <div>
            <Button
              type="submit"
              size="sm"
              disabled={
                savingName ||
                name.trim() === initialName ||
                name.trim().length < 2
              }
            >
              {savingName ? "Saving" : "Save name"}
            </Button>
          </div>
        </form>
      </AdminCard>

      <AdminCard
        title="Password"
        description="Changing it signs you out on every device, including this one."
      >
        <form
          onSubmit={savePassword}
          noValidate
          className="flex flex-col gap-5"
        >
          <input
            type="email"
            value={email}
            autoComplete="username"
            readOnly
            hidden
          />
          <PasswordField
            label="Current password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            error={errors.current}
            fieldClassName="sm:max-w-sm"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              label="New password"
              autoComplete="new-password"
              hint={PASSWORD_HINT}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              error={errors.next}
            />
            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors.confirm}
            />
          </div>
          <div>
            <Button type="submit" size="sm" disabled={savingPassword}>
              {savingPassword ? "Changing" : "Change password"}
            </Button>
          </div>
        </form>
      </AdminCard>
    </div>
  );
}
