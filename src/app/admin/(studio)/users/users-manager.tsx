"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RadioGroup } from "radix-ui";
import { toast } from "sonner";
import {
  KeyRound,
  LogOut,
  Mail,
  Pencil,
  RotateCw,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import {
  CONTENT_AREAS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type AdminRole,
} from "@/lib/admin/permissions";
import { formatDate, timeAgo } from "@/lib/admin/format";
import { Button } from "@/components/site/button";
import { AdminCard, StatusPill } from "@/components/admin/kit/layout";
import { CheckboxField, TextField } from "@/components/admin/kit/fields";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { RowActions, type RowAction } from "@/components/admin/kit/row-actions";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { useConfirm } from "@/components/admin/kit/feedback";
import {
  inviteUser,
  resendInvite,
  revokeInvite,
  sendUserPasswordReset,
  setUserActive,
  signOutUserEverywhere,
  updateUserAccess,
} from "./actions";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  access: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type InviteRow = {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  access: string[];
  invitedBy: string | null;
  expiresAt: string;
  createdAt: string;
};

type Result = { success: boolean; message?: string; link?: string };

const AREA_LABEL = Object.fromEntries(
  CONTENT_AREAS.map((a) => [a.key, a.label]),
);

function accessSummary(role: AdminRole, access: string[]) {
  if (role === "ADMIN") return "Everything";
  if (access.length === 0) return "No areas";
  if (access.length === CONTENT_AREAS.length) return "All content areas";
  return access.map((a) => AREA_LABEL[a] ?? a).join(", ");
}

/** Show the outcome; offer to copy a link when the action made one. */
function report(res: Result) {
  if (!res.success) {
    toast.error(res.message ?? "That didn't work. Please try again.");
    return;
  }
  toast.success(res.message ?? "Done", {
    duration: res.link ? 12000 : 4000,
    action: res.link
      ? {
          label: "Copy link",
          onClick: () => {
            void navigator.clipboard.writeText(res.link!);
            toast.success("Link copied");
          },
        }
      : undefined,
  });
}

export function UsersManager({
  users,
  invites,
  meId,
}: {
  users: UserRow[];
  invites: InviteRow[];
  meId: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  const run = (fn: () => Promise<Result>, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      report(res);
      if (res.success) {
        after?.();
        router.refresh();
      }
    });

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: "Name",
      primary: true,
      sortValue: (u) => u.name,
      cell: (u) => (
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2 font-bold">
            {u.name}
            {u.id === meId && <StatusPill>You</StatusPill>}
          </span>
          <span className="text-surface-muted truncate text-xs">{u.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortValue: (u) => u.role,
      cell: (u) => (
        <StatusPill tone={u.role === "ADMIN" ? "royal" : "brand"}>
          {ROLE_LABELS[u.role]}
        </StatusPill>
      ),
    },
    {
      key: "access",
      header: "Can manage",
      hideOnMobile: true,
      hideBelow: "lg",
      className: "max-w-[18rem]",
      cell: (u) => (
        <span className="text-surface-muted line-clamp-2 text-xs leading-relaxed">
          {accessSummary(u.role, u.access)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (u) => (u.isActive ? 0 : 1),
      cell: (u) =>
        u.isActive ? (
          <StatusPill tone="success" dot>
            Active
          </StatusPill>
        ) : (
          <StatusPill tone="danger" dot>
            Disabled
          </StatusPill>
        ),
    },
    {
      key: "last",
      header: "Last sign-in",
      hideBelow: "xl",
      sortValue: (u) => (u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : 0),
      cell: (u) => (
        <span className="text-surface-muted text-xs whitespace-nowrap">
          {u.lastLoginAt ? timeAgo(u.lastLoginAt) : "Never"}
        </span>
      ),
    },
  ];

  const actionsFor = (u: UserRow): RowAction[] => {
    const isMe = u.id === meId;
    return [
      {
        label: "Edit role and access",
        icon: <Pencil />,
        onSelect: () => setEditing(u),
        hidden: isMe,
      },
      {
        label: "Send password reset",
        icon: <KeyRound />,
        disabled: !u.isActive,
        onSelect: () => run(() => sendUserPasswordReset(u.id)),
      },
      {
        label: "Sign out everywhere",
        icon: <LogOut />,
        hidden: isMe,
        onSelect: async () => {
          if (
            await confirm({
              title: `Sign ${u.name} out everywhere?`,
              description: "They'll need to sign in again on every device.",
              confirmLabel: "Sign out",
            })
          )
            run(() => signOutUserEverywhere(u.id));
        },
      },
      "separator",
      {
        label: u.isActive ? "Disable account" : "Enable account",
        icon: u.isActive ? <UserX /> : <UserCheck />,
        danger: u.isActive,
        hidden: isMe,
        onSelect: async () => {
          if (u.isActive) {
            const ok = await confirm({
              title: `Disable ${u.name}?`,
              description:
                "They'll be signed out straight away and won't be able to sign in. Their past changes stay in the activity log. You can enable them again later.",
              confirmLabel: "Disable",
              danger: true,
            });
            if (!ok) return;
          }
          run(() => setUserActive(u.id, !u.isActive));
        },
      },
    ];
  };

  return (
    <div className="flex flex-col gap-8">
      <DataTable
        label="Admin users"
        rows={users}
        columns={columns}
        getRowId={(u) => u.id}
        rowLabel={(u) => u.name}
        rowActions={actionsFor}
        searchText={(u) => `${u.name} ${u.email}`}
        searchPlaceholder="Search people"
        onRowClick={(u) => setEditing(u)}
        filters={[
          {
            key: "role",
            label: "Role",
            options: [
              { value: "ADMIN", label: "Admin" },
              { value: "EDITOR", label: "Editor" },
            ],
            match: (u, v) => u.role === v,
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "disabled", label: "Disabled" },
            ],
            match: (u, v) => (v === "active" ? u.isActive : !u.isActive),
          },
        ]}
        toolbar={
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus aria-hidden className="size-4" />
            Invite someone
          </Button>
        }
      />

      <AdminCard
        title="Pending invites"
        description="Invites work once and expire after 7 days."
        padded={invites.length > 0}
      >
        {invites.length === 0 ? (
          <p className="text-surface-muted px-5 pb-5 text-sm md:px-6 md:pb-6">
            No invites waiting. People you invite show up here until they
            accept.
          </p>
        ) : (
          <ul className="flex flex-col">
            {invites.map((i) => {
              const expired = new Date(i.expiresAt) < new Date();
              return (
                <li
                  key={i.id}
                  className="border-surface-rule flex items-start gap-3 border-b py-3.5 first:pt-0 last:border-b-0 last:pb-0 sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                      {i.name ? `${i.name} · ` : ""}
                      {i.email}
                      <StatusPill tone={i.role === "ADMIN" ? "royal" : "brand"}>
                        {ROLE_LABELS[i.role]}
                      </StatusPill>
                      {expired && (
                        <StatusPill tone="warning">Expired</StatusPill>
                      )}
                    </p>
                    <p className="text-surface-muted text-xs">
                      {accessSummary(i.role, i.access)} · Invited{" "}
                      {i.invitedBy ? `by ${i.invitedBy} ` : ""}
                      {timeAgo(i.createdAt)} · {expired ? "Expired" : "Expires"}{" "}
                      {formatDate(i.expiresAt)}
                    </p>
                  </div>
                  <RowActions
                    label={`Actions for the invite to ${i.email}`}
                    title={i.email}
                    actions={[
                      {
                        label: "Resend invite",
                        icon: <RotateCw />,
                        disabled: pending,
                        onSelect: () => run(() => resendInvite(i.id)),
                      },
                      "separator",
                      {
                        label: "Cancel invite",
                        icon: <X />,
                        danger: true,
                        disabled: pending,
                        onSelect: async () => {
                          if (
                            await confirm({
                              title: `Cancel the invite to ${i.email}?`,
                              description:
                                "The link in their email will stop working.",
                              confirmLabel: "Cancel invite",
                              cancelLabel: "Keep it",
                              danger: true,
                            })
                          )
                            run(() => revokeInvite(i.id));
                        },
                      },
                    ]}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      <InvitePanel
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        pending={pending}
        onSubmit={(input) =>
          run(
            () => inviteUser(input),
            () => setInviteOpen(false),
          )
        }
      />

      <EditPanel
        key={editing?.id ?? "none"}
        user={editing}
        isMe={editing?.id === meId}
        pending={pending}
        onClose={() => setEditing(null)}
        onSubmit={(id, input) =>
          run(
            () => updateUserAccess(id, input),
            () => setEditing(null),
          )
        }
      />
    </div>
  );
}

/** Admin vs Editor, and which areas an Editor can manage. */
function RoleAccessPicker({
  role,
  access,
  onRole,
  onAccess,
  lockRole,
}: {
  role: AdminRole;
  access: string[];
  onRole: (r: AdminRole) => void;
  onAccess: (a: string[]) => void;
  lockRole?: string;
}) {
  const toggle = (key: string, on: boolean) =>
    onAccess(
      on ? [...new Set([...access, key])] : access.filter((a) => a !== key),
    );
  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">Role</legend>
        <RadioGroup.Root
          value={role}
          onValueChange={(v) => onRole(v as AdminRole)}
          disabled={!!lockRole}
          className="grid gap-2 sm:grid-cols-2"
        >
          {(["EDITOR", "ADMIN"] as const).map((r) => (
            <RadioGroup.Item
              key={r}
              value={r}
              className="data-[state=checked]:border-royal data-[state=checked]:bg-ice flex flex-col items-start gap-1 rounded-[10px] border border-charcoal/[0.14] bg-white p-4 text-left outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)] disabled:opacity-60"
            >
              <span className="flex w-full items-center justify-between text-sm font-bold">
                {ROLE_LABELS[r]}
                <span className="border-charcoal/30 inline-flex size-4 items-center justify-center rounded-full border bg-white">
                  <RadioGroup.Indicator className="bg-royal size-2 rounded-full" />
                </span>
              </span>
              <span className="text-surface-muted text-xs leading-relaxed">
                {ROLE_DESCRIPTIONS[r]}
              </span>
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
        {lockRole && <p className="text-surface-muted text-xs">{lockRole}</p>}
      </fieldset>

      {role === "EDITOR" && (
        <fieldset className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <legend className="text-sm font-bold">Can manage</legend>
            <div className="flex gap-3 text-xs font-bold">
              <button
                type="button"
                className="text-royal dx-link"
                onClick={() => onAccess(CONTENT_AREAS.map((a) => a.key))}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-surface-muted dx-link"
                onClick={() => onAccess([])}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CONTENT_AREAS.map((a) => (
              <CheckboxField
                key={a.key}
                label={a.label}
                description={a.description}
                checked={access.includes(a.key)}
                onCheckedChange={(on) => toggle(a.key, on)}
              />
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}

function InvitePanel({
  open,
  onOpenChange,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onSubmit: (input: {
    email: string;
    name: string;
    role: AdminRole;
    access: string[];
  }) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("EDITOR");
  const [access, setAccess] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError("Enter a valid email.");
    if (role === "EDITOR" && access.length === 0)
      return setError("Pick at least one area this Editor can manage.");
    setError(null);
    onSubmit({ email: email.trim(), name: name.trim(), role, access });
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setEmail("");
          setName("");
          setRole("EDITOR");
          setAccess([]);
          setError(null);
        }
      }}
      title="Invite someone"
      description="They'll get an email with a link to set their name and password."
      width="lg"
      footer={
        <>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" type="submit" form="invite-form" disabled={pending}>
            <Mail aria-hidden className="size-4" />
            {pending ? "Sending" : "Send invite"}
          </Button>
        </>
      }
    >
      <form
        id="invite-form"
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error?.includes("email") ? error : undefined}
          />
          <TextField
            label="Name"
            hint="Optional. They can change it."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <RoleAccessPicker
          role={role}
          access={access}
          onRole={setRole}
          onAccess={setAccess}
        />
        {error && !error.includes("email") && (
          <p role="alert" className="text-sm font-bold text-[#c2410c]">
            {error}
          </p>
        )}
      </form>
    </SidePanel>
  );
}

function EditPanel({
  user,
  isMe,
  pending,
  onClose,
  onSubmit,
}: {
  user: UserRow | null;
  isMe: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (id: string, input: { role: AdminRole; access: string[] }) => void;
}) {
  const [role, setRole] = useState<AdminRole>(user?.role ?? "EDITOR");
  const [access, setAccess] = useState<string[]>(user?.access ?? []);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (role === "EDITOR" && access.length === 0)
      return setError(
        "Pick at least one area, or disable the account instead.",
      );
    setError(null);
    onSubmit(user.id, { role, access });
  };

  return (
    <SidePanel
      open={!!user}
      onOpenChange={(o) => !o && onClose()}
      title={user ? user.name : "Edit user"}
      description={user?.email}
      width="lg"
      footer={
        <>
          <Button variant="subtle" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            type="submit"
            form="edit-user-form"
            disabled={pending || isMe}
          >
            {pending ? "Saving" : "Save changes"}
          </Button>
        </>
      }
    >
      <form
        id="edit-user-form"
        onSubmit={submit}
        className="flex flex-col gap-6"
      >
        {user && (
          <dl className="grid grid-cols-2 gap-4 rounded-[10px] bg-white p-4 text-sm ring-1 ring-black/[0.06]">
            <div>
              <dt className="text-surface-muted text-xs">Joined</dt>
              <dd className="font-bold">{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-surface-muted text-xs">Last sign-in</dt>
              <dd className="font-bold">
                {user.lastLoginAt ? timeAgo(user.lastLoginAt) : "Never"}
              </dd>
            </div>
          </dl>
        )}
        <RoleAccessPicker
          role={role}
          access={access}
          onRole={setRole}
          onAccess={setAccess}
          lockRole={
            isMe
              ? "You can't change your own role. Ask another Admin."
              : undefined
          }
        />
        {error && (
          <p role="alert" className="text-sm font-bold text-[#c2410c]">
            {error}
          </p>
        )}
      </form>
    </SidePanel>
  );
}
