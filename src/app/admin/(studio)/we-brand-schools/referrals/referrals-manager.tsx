"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Copy,
  Eye,
  Link2,
  MousePointerClick,
  Pause,
  Pencil,
  Play,
  Plus,
  Rocket,
  Send,
  Trash2,
} from "lucide-react";
import { referralLinkSchema, type ReferralLinkInput } from "@/lib/validators";
import { Button } from "@/components/site/button";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { StatusPill, type PillTone } from "@/components/admin/kit/layout";
import { SidePanel } from "@/components/admin/kit/side-panel";
import {
  SelectField,
  SwitchField,
  TextField,
} from "@/components/admin/kit/fields";
import { DateTimeField } from "@/components/admin/kit/inputs";
import {
  CopyButton,
  DetailList,
  StatCard,
} from "@/components/admin/kit/display";
import { useConfirm } from "@/components/admin/kit/feedback";
import {
  createReferralLink,
  deleteReferralLink,
  deleteReferralLinks,
  updateReferralLink,
  updateReferralLinkStatus,
  type ReferralLinkRow,
} from "../actions";
import { checkForm, formatDateTime } from "../_components/form";

type Row = ReferralLinkRow;
type Form = {
  displayName: string;
  slug: string;
  email: string;
  location: string;
  expiresAt: Date | null;
  status: ReferralLinkInput["status"];
  notificationEnabled: boolean;
};

const n = (v: number) => new Intl.NumberFormat("en-GB").format(v);
const rate = (v: number | null) =>
  v === null
    ? "No visits yet"
    : new Intl.NumberFormat("en-GB", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(v);

const isDeleted = (r: Row) => !!r.deletedAt;
const isExpired = (r: Row) =>
  !r.deletedAt &&
  !!r.expiresAt &&
  new Date(r.expiresAt).getTime() <= Date.now();

function state(r: Row): { label: string; tone: PillTone } {
  if (isDeleted(r)) return { label: "Deleted", tone: "danger" };
  if (isExpired(r)) return { label: "Expired", tone: "warning" };
  return r.status === "ACTIVE"
    ? { label: "Active", tone: "success" }
    : { label: "Paused", tone: "neutral" };
}

function notification(r: Row): { label: string; tone: PillTone } {
  if (!r.notificationEnabled) return { label: "Off", tone: "neutral" };
  switch (r.latestNotificationStatus) {
    case "SENT":
      return { label: "Last one sent", tone: "success" };
    case "FAILED":
      return { label: "Last one failed", tone: "danger" };
    case "SKIPPED":
      return { label: "Last one skipped", tone: "warning" };
    default:
      return { label: "On", tone: "brand" };
  }
}

const toForm = (r?: Row): Form => ({
  displayName: r?.displayName ?? "",
  slug: r?.slug ?? "",
  email: r?.email ?? "",
  location: r?.location ?? "",
  expiresAt: r?.expiresAt ? new Date(r.expiresAt) : null,
  status: r?.status ?? "ACTIVE",
  notificationEnabled: r?.notificationEnabled ?? true,
});

export function ReferralsManager({ referrals }: { referrals: Row[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const linkFor = (slug: string) => `${origin}/webrandschools/r/${slug}`;

  const [viewing, setViewing] = useState<Row | null>(null);
  const [editing, setEditing] = useState<{
    id: string | null;
    form: Form;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const live = referrals.filter((r) => !isDeleted(r));
  const totals = live.reduce(
    (t, r) => ({
      visits: t.visits + r.visitCount,
      applications: t.applications + r.applicationCount,
      sites: t.sites + r.liveSiteCount,
    }),
    { visits: 0, applications: 0, sites: 0 },
  );

  const openEdit = (r?: Row) => {
    setErrors({});
    setViewing(null);
    setEditing({ id: r?.id ?? null, form: toForm(r) });
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const save = async () => {
    if (!editing) return;
    const f = editing.form;
    const checked = checkForm(referralLinkSchema, {
      ...f,
      location: f.location.trim() || null,
      expiresAt: f.expiresAt ? f.expiresAt.toISOString() : null,
    });
    if (!checked.ok) {
      setErrors(checked.errors);
      toast.error(checked.first);
      return;
    }
    setSaving(true);
    const result = editing.id
      ? await updateReferralLink(editing.id, checked.data)
      : await createReferralLink(checked.data);
    setSaving(false);
    if (!result.success) return void toast.error(result.message);
    toast.success(editing.id ? "Referral link saved" : "Referral link created");
    setEditing(null);
    router.refresh();
  };

  const toggle = async (r: Row) => {
    const result = await updateReferralLinkStatus(
      r.id,
      r.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
    );
    if (!result.success) return void toast.error(result.message);
    toast.success(r.status === "ACTIVE" ? "Link paused" : "Link active again");
    setViewing(null);
    router.refresh();
  };

  const copy = async (r: Row) => {
    try {
      await navigator.clipboard.writeText(linkFor(r.slug));
      toast.success("Link copied");
    } catch {
      toast.error(linkFor(r.slug));
    }
  };

  const remove = async (r: Row) => {
    const ok = await confirm({
      title: `Delete ${r.displayName}'s link?`,
      description:
        "The link stops working. Its visits and applications stay in the reports, marked deleted.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteReferralLink(r.id);
    if (!result.success) return void toast.error(result.message);
    toast.success("Referral link deleted");
    setViewing(null);
    router.refresh();
  };

  const removeMany = async (ids: string[]) => {
    const ok = await confirm({
      title: `Delete ${ids.length} referral link${ids.length === 1 ? "" : "s"}?`,
      description:
        "The links stop working. Their history stays in the reports.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteReferralLinks(ids);
    if (!result.success) return void toast.error(result.message);
    toast.success(result.message);
    router.refresh();
  };

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Name or organisation",
      primary: true,
      sortValue: (r) => r.displayName.toLowerCase(),
      cell: (r) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-bold">{r.displayName}</span>
          <span className="text-surface-muted truncate text-xs">
            {r.email}
            {r.location ? ` · ${r.location}` : ""}
          </span>
        </span>
      ),
    },
    {
      key: "link",
      header: "Link",
      hideBelow: "lg",
      sortValue: (r) => r.slug,
      cell: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void copy(r);
          }}
          title="Copy link"
          className="text-royal hover:bg-ice inline-flex max-w-[16rem] items-center gap-1.5 truncate rounded-[6px] px-1.5 py-1 font-mono text-xs"
        >
          <Copy aria-hidden className="size-3.5 shrink-0" />
          /r/{r.slug}
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => state(r).label,
      cell: (r) => {
        const s = state(r);
        return (
          <span className="flex flex-col items-start gap-1">
            <StatusPill tone={s.tone} dot>
              {s.label}
            </StatusPill>
            {r.expiresAt && !isDeleted(r) && (
              <span className="text-surface-muted text-xs">
                {isExpired(r) ? "Ended" : "Ends"} {formatDateTime(r.expiresAt)}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "visits",
      header: "Visits",
      hideBelow: "xl",
      sortValue: (r) => r.visitCount,
      cell: (r) => <span className="tabular-nums">{n(r.visitCount)}</span>,
    },
    {
      key: "applications",
      header: "Applications",
      sortValue: (r) => r.applicationCount,
      cell: (r) => (
        <span className="tabular-nums">{n(r.applicationCount)}</span>
      ),
    },
    {
      key: "sites",
      header: "Live sites",
      hideBelow: "lg",
      sortValue: (r) => r.liveSiteCount,
      cell: (r) => <span className="tabular-nums">{n(r.liveSiteCount)}</span>,
    },
  ];

  const f = editing?.form;
  const v = viewing;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Links in use"
          value={n(live.length)}
          icon={<Link2 />}
        />
        <StatCard
          label="Visits"
          value={n(totals.visits)}
          icon={<MousePointerClick />}
        />
        <StatCard
          label="Applications"
          value={n(totals.applications)}
          icon={<Send />}
        />
        <StatCard
          label="Sites live"
          value={n(totals.sites)}
          icon={<Rocket />}
        />
      </div>

      <DataTable
        label="Referral links"
        rows={referrals}
        columns={columns}
        getRowId={(r) => r.id}
        rowLabel={(r) => r.displayName}
        onRowClick={(r) => setViewing(r)}
        searchText={(r) =>
          `${r.displayName} ${r.email} ${r.slug} ${r.code} ${r.location ?? ""}`
        }
        searchPlaceholder="Search names, emails or links"
        filters={[
          {
            key: "report",
            label: "Show",
            options: [
              { value: "current", label: "Not deleted" },
              { value: "active", label: "Active" },
              { value: "paused", label: "Paused" },
              { value: "expired", label: "Expired" },
              { value: "deleted", label: "Deleted" },
              { value: "applications", label: "Has applications" },
              { value: "sites", label: "Has live sites" },
            ],
            match: (r, val) => {
              switch (val) {
                case "current":
                  return !isDeleted(r);
                case "active":
                  return (
                    r.status === "ACTIVE" && !isExpired(r) && !isDeleted(r)
                  );
                case "paused":
                  return (
                    r.status === "INACTIVE" && !isExpired(r) && !isDeleted(r)
                  );
                case "expired":
                  return isExpired(r);
                case "deleted":
                  return isDeleted(r);
                case "applications":
                  return r.applicationCount > 0;
                case "sites":
                  return r.liveSiteCount > 0;
                default:
                  return true;
              }
            },
          },
        ]}
        rowActions={(r) => [
          { label: "Copy link", icon: <Copy />, onSelect: () => void copy(r) },
          { label: "Details", icon: <Eye />, onSelect: () => setViewing(r) },
          {
            label: "Edit",
            icon: <Pencil />,
            onSelect: () => openEdit(r),
            hidden: isDeleted(r),
          },
          {
            label: r.status === "ACTIVE" ? "Pause link" : "Make active",
            icon: r.status === "ACTIVE" ? <Pause /> : <Play />,
            onSelect: () => void toggle(r),
            hidden: isDeleted(r),
          },
          "separator",
          {
            label: "Delete",
            icon: <Trash2 />,
            danger: true,
            onSelect: () => void remove(r),
            hidden: isDeleted(r),
          },
        ]}
        bulkActions={[
          {
            label: "Delete",
            icon: <Trash2 />,
            danger: true,
            onClick: removeMany,
          },
        ]}
        toolbar={
          <Button size="sm" onClick={() => openEdit()}>
            <Plus aria-hidden className="size-4" /> New referral link
          </Button>
        }
        empty={{
          icon: <Link2 />,
          title: "No referral links",
          description:
            "Give partners their own link to the We Brand Schools page, and see the visits, applications and live sites it brings.",
          action: (
            <Button size="sm" onClick={() => openEdit()}>
              <Plus aria-hidden className="size-4" /> New referral link
            </Button>
          ),
        }}
      />

      {/* Details */}
      <SidePanel
        open={!!v}
        onOpenChange={(o) => !o && setViewing(null)}
        width="lg"
        title={v?.displayName ?? ""}
        description={v ? `Referral link · code ${v.code}` : undefined}
        footer={
          v && !isDeleted(v) ? (
            <>
              <Button size="sm" variant="subtle" onClick={() => void toggle(v)}>
                {v.status === "ACTIVE" ? (
                  <>
                    <Pause aria-hidden className="size-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play aria-hidden className="size-4" /> Make active
                  </>
                )}
              </Button>
              <Button size="sm" onClick={() => openEdit(v)}>
                <Pencil aria-hidden className="size-4" /> Edit
              </Button>
            </>
          ) : undefined
        }
      >
        {v && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <StatusPill tone={state(v).tone} dot>
                {state(v).label}
              </StatusPill>
              <StatusPill tone={notification(v).tone}>
                Emails: {notification(v).label}
              </StatusPill>
            </div>
            <div className="flex items-center gap-3 rounded-[10px] bg-white p-4 ring-1 ring-black/[0.06]">
              <Link2 aria-hidden className="text-royal size-5 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-mono text-sm">
                {linkFor(v.slug)}
              </span>
              <CopyButton value={linkFor(v.slug)} label="Copy link" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Visits", n(v.visitCount)],
                ["Templates picked", n(v.templateSelectionCount)],
                ["Applications", n(v.applicationCount)],
                ["Sites live", n(v.liveSiteCount)],
                ["Conversion", rate(v.conversionRate)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 rounded-[10px] bg-white p-4 ring-1 ring-black/[0.06]"
                >
                  <span className="text-surface-muted text-xs font-bold">
                    {label}
                  </span>
                  <span className="text-xl font-bold tabular-nums">
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <DetailList
              items={[
                { label: "Email", value: v.email },
                { label: "Location", value: v.location || "Not given" },
                {
                  label: "Ends",
                  value: v.expiresAt ? formatDateTime(v.expiresAt) : "Never",
                },
                { label: "Created", value: formatDateTime(v.createdAt) },
                {
                  label: "Created by",
                  value: v.createdByAdmin?.name ?? "Unknown",
                },
                {
                  label: "Last activity",
                  value: v.lastActivityAt
                    ? formatDateTime(v.lastActivityAt)
                    : "None yet",
                },
                {
                  label: "Last email to them",
                  value: v.latestNotificationAt
                    ? `${notification(v).label.replace(/^Last one /, "")} · ${formatDateTime(v.latestNotificationAt)}`
                    : "None yet",
                },
                ...(v.deletedAt
                  ? [{ label: "Deleted", value: formatDateTime(v.deletedAt) }]
                  : []),
              ]}
            />
          </div>
        )}
      </SidePanel>

      {/* Create / edit */}
      <SidePanel
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing?.id ? "Edit referral link" : "New referral link"}
        description="A link to the We Brand Schools page that credits this person or organisation."
        footer={
          <>
            <Button size="sm" variant="subtle" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing?.id ? "Save" : "Create link"}
            </Button>
          </>
        }
      >
        {f && (
          <div className="flex flex-col gap-5">
            <TextField
              label="Name or organisation"
              value={f.displayName}
              maxLength={160}
              onChange={(e) => set("displayName", e.target.value)}
              error={errors.displayName}
              required
            />
            <TextField
              label="Their email"
              type="email"
              value={f.email}
              maxLength={254}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              hint="Where updates about their referrals go."
              required
            />
            <TextField
              label="Link ending"
              prefix="/webrandschools/r/"
              value={f.slug}
              maxLength={80}
              onChange={(e) =>
                set(
                  "slug",
                  e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""),
                )
              }
              placeholder="graceschools"
              hint="Lowercase letters and numbers only."
              error={errors.slug}
              required
            />
            <TextField
              label="State, city or area"
              value={f.location}
              maxLength={160}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Lagos"
              error={errors.location}
            />
            <DateTimeField
              label="Link ends"
              value={f.expiresAt}
              onChange={(d) => set("expiresAt", d)}
              min={new Date()}
              hint="Leave empty to keep it open. They're emailed before it ends."
              error={errors.expiresAt}
            />
            <SelectField
              label="Status"
              value={f.status}
              onChange={(e) =>
                set("status", e.target.value as ReferralLinkInput["status"])
              }
              options={[
                { value: "ACTIVE", label: "Active" },
                {
                  value: "INACTIVE",
                  label: "Paused (the link doesn't credit them)",
                },
              ]}
              error={errors.status}
            />
            <SwitchField
              label="Email them updates"
              description="For example when a school they referred goes live, or before their link ends."
              checked={f.notificationEnabled}
              onCheckedChange={(val) => set("notificationEnabled", val)}
            />
          </div>
        )}
      </SidePanel>
    </div>
  );
}
