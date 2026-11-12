"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Eye,
  GraduationCap,
  Hammer,
  Loader2,
  Pencil,
  Rocket,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/site/button";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { StatusPill, type PillTone } from "@/components/admin/kit/layout";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { Modal } from "@/components/admin/kit/overlays";
import {
  SelectField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import { DetailList } from "@/components/admin/kit/display";
import { useConfirm } from "@/components/admin/kit/feedback";
import {
  deleteSchoolWebsiteApplication,
  deleteSchoolWebsiteApplications,
  startSchoolWebsiteProject,
  updateSchoolWebsiteApplicationStatus,
  type SchoolWebsiteApplicationRow,
} from "../actions";
import { formatDateTime } from "../_components/form";

type Row = SchoolWebsiteApplicationRow;
type Status = Row["status"];

const STATUS: Record<Status, { label: string; tone: PillTone }> = {
  PENDING: { label: "New", tone: "warning" },
  IN_PROGRESS: { label: "In progress", tone: "brand" },
  LIVE: { label: "Live", tone: "success" },
  DECLINED: { label: "Declined", tone: "danger" },
};

const DEFAULT_GO_LIVE_MESSAGE =
  "Please change your portal password after your first login.";

const hasReferral = (a: Row) =>
  !!(
    a.referralLinkId ||
    a.referralCodeSnapshot ||
    a.referralNameSnapshot ||
    a.referralSlugSnapshot
  );
const referralName = (a: Row) =>
  a.referralNameSnapshot ?? a.referralLink?.displayName ?? "Referral";
const referralSlug = (a: Row) =>
  a.referralSlugSnapshot ?? a.referralLink?.slug ?? null;
const referralCode = (a: Row) =>
  a.referralCodeSnapshot ?? a.referralLink?.code ?? null;
const referralKey = (a: Row) =>
  a.referralLinkId ?? referralCode(a) ?? referralSlug(a) ?? null;
const referralExpired = (a: Row) =>
  !!(
    a.referralLink?.expiresAt &&
    new Date(a.referralLink.expiresAt).getTime() <= Date.now()
  );
const referralActive = (a: Row) =>
  !!(
    a.referralLink &&
    a.referralLink.status === "ACTIVE" &&
    !a.referralLink.deletedAt &&
    !referralExpired(a)
  );

function referralState(a: Row): { label: string; tone: PillTone } {
  if (!hasReferral(a)) return { label: "Direct", tone: "neutral" };
  if (referralExpired(a)) return { label: "Expired link", tone: "warning" };
  if (referralActive(a)) return { label: "Referred", tone: "brand" };
  return { label: "Referred (link off)", tone: "neutral" };
}

const domainLabel = (a: Row) =>
  a.domainChoice === "HAS_DOMAIN" ? "Has a domain" : "Needs a domain";

const withHttps = (v?: string | null) => {
  const t = v?.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
};
const suggestedUrl = (a: Row) =>
  withHttps(a.existingDomain ?? a.preferredDomain1 ?? a.officialWebsiteUrl);

const editorHref = (projectId: string) =>
  `/admin/we-brand-schools/projects/${projectId}/editor`;

export function ApplicationsManager({
  applications,
  openId,
}: {
  applications: Row[];
  openId?: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const initial = applications.find((a) => a.id === openId) ?? null;
  const [viewingId, setViewingIdRaw] = useState<string | null>(
    initial?.id ?? null,
  );
  const viewing = applications.find((a) => a.id === viewingId) ?? null;
  const [status, setStatus] = useState<Status>(initial?.status ?? "PENDING");
  const [notes, setNotes] = useState(initial?.adminNotes ?? "");
  const setViewingId = (id: string | null) => {
    const a = applications.find((x) => x.id === id);
    if (a) {
      setStatus(a.status);
      setNotes(a.adminNotes ?? "");
    }
    setViewingIdRaw(id);
  };
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [goLive, setGoLive] = useState<{
    app: Row;
    notes: string;
    websiteUrl: string;
    portalUrl: string;
    portalPassword: string;
    message: string;
  } | null>(null);
  const [sending, setSending] = useState(false);

  const referralOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of applications) {
      const key = hasReferral(a) ? referralKey(a) : null;
      if (!key || seen.has(key)) continue;
      const slug = referralSlug(a);
      seen.set(key, `${referralName(a)}${slug ? ` (/r/${slug})` : ""}`);
    }
    return [...seen.entries()]
      .sort((x, y) => x[1].localeCompare(y[1]))
      .map(([key, label]) => ({ value: `ref:${key}`, label }));
  }, [applications]);

  const startProject = async (a: Row) => {
    setStarting(a.id);
    const result = await startSchoolWebsiteProject(a.id);
    setStarting(null);
    if (!result.success || !result.projectId)
      return void toast.error(result.message);
    toast.success(result.message);
    router.push(result.redirectHref ?? editorHref(result.projectId));
  };

  const openGoLive = (a: Row, adminNotes = a.adminNotes ?? "") =>
    setGoLive({
      app: a,
      notes: adminNotes,
      websiteUrl: suggestedUrl(a),
      portalUrl: "",
      portalPassword: "",
      message: DEFAULT_GO_LIVE_MESSAGE,
    });

  const saveStatus = async () => {
    if (!viewing) return;
    if (status === "LIVE" && viewing.status !== "LIVE")
      return openGoLive(viewing, notes);
    setSaving(true);
    const result = await updateSchoolWebsiteApplicationStatus(viewing.id, {
      status,
      adminNotes: notes,
    });
    setSaving(false);
    if (!result.success) return void toast.error(result.message);
    toast.success(result.message);
    router.refresh();
  };

  const sendGoLive = async () => {
    if (!goLive) return;
    setSending(true);
    const result = await updateSchoolWebsiteApplicationStatus(goLive.app.id, {
      status: "LIVE",
      adminNotes: goLive.notes,
      goLiveDetails: {
        websiteUrl: goLive.websiteUrl,
        portalUrl: goLive.portalUrl,
        portalPassword: goLive.portalPassword,
        adminMessage: goLive.message,
      },
    });
    setSending(false);
    if (!result.success) return void toast.error(result.message);
    toast.success(result.message);
    setGoLive(null);
    router.refresh();
  };

  const remove = async (a: Row) => {
    const ok = await confirm({
      title: `Delete ${a.schoolName}'s application?`,
      description: `It's deleted for good${a.project ? ", with its website project and everything edited in it" : ""}. Referral reports keep their history.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteSchoolWebsiteApplication(a.id);
    if (!result.success) return void toast.error(result.message);
    toast.success("Application deleted");
    if (viewingId === a.id) setViewingId(null);
    router.refresh();
  };

  const removeMany = async (ids: string[]) => {
    const ok = await confirm({
      title: `Delete ${ids.length} application${ids.length === 1 ? "" : "s"}?`,
      description:
        "They're deleted for good, with any website projects started from them.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteSchoolWebsiteApplications(ids);
    if (!result.success) return void toast.error(result.message);
    toast.success(result.message);
    if (viewingId && ids.includes(viewingId)) setViewingId(null);
    router.refresh();
  };

  const columns: Column<Row>[] = [
    {
      key: "school",
      header: "School",
      primary: true,
      sortValue: (a) => a.schoolName.toLowerCase(),
      cell: (a) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-bold">{a.schoolName}</span>
          <span className="text-surface-muted truncate text-xs">
            {a.selectedTemplateName}
          </span>
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      hideBelow: "lg",
      cell: (a) => (
        <span className="flex min-w-0 flex-col text-sm">
          <span className="truncate">
            {a.officialContactName || "Not given"}
          </span>
          <span className="text-surface-muted truncate text-xs">
            {a.officialContactEmail || a.officialEmail}
          </span>
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      hideBelow: "xl",
      sortValue: (a) => (hasReferral(a) ? referralName(a) : ""),
      cell: (a) => {
        const s = referralState(a);
        return (
          <span className="flex flex-col items-start gap-1">
            <StatusPill tone={s.tone}>{s.label}</StatusPill>
            {hasReferral(a) && (
              <span className="text-surface-muted text-xs">
                {referralName(a)}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "domain",
      header: "Domain",
      hideBelow: "xl",
      cell: (a) => (
        <span className="text-surface-muted text-sm">{domainLabel(a)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (a) => Object.keys(STATUS).indexOf(a.status),
      cell: (a) => (
        <StatusPill tone={STATUS[a.status].tone} dot>
          {STATUS[a.status].label}
        </StatusPill>
      ),
    },
    {
      key: "received",
      header: "Received",
      sortValue: (a) => new Date(a.createdAt),
      cell: (a) => (
        <span className="text-surface-muted text-sm whitespace-nowrap">
          {formatDateTime(a.createdAt)}
        </span>
      ),
    },
  ];

  const v = viewing;
  const statusChanged =
    !!v && (status !== v.status || notes !== (v.adminNotes ?? ""));

  const projectAction = (a: Row) =>
    a.project ? (
      <Button size="sm" href={editorHref(a.project.id)}>
        <Pencil aria-hidden className="size-4" /> Continue editing the site
      </Button>
    ) : a.status === "PENDING" || a.status === "IN_PROGRESS" ? (
      <Button
        size="sm"
        onClick={() => void startProject(a)}
        disabled={starting === a.id}
      >
        {starting === a.id ? (
          <Loader2 aria-hidden className="size-4 animate-spin" />
        ) : (
          <Hammer aria-hidden className="size-4" />
        )}
        {a.status === "IN_PROGRESS"
          ? "Start editing the site"
          : "Start the website"}
      </Button>
    ) : null;

  return (
    <>
      <DataTable
        label="Applications"
        rows={applications}
        columns={columns}
        getRowId={(a) => a.id}
        rowLabel={(a) => a.schoolName}
        onRowClick={(a) => setViewingId(a.id)}
        searchText={(a) =>
          `${a.schoolName} ${a.selectedTemplateName} ${a.officialContactName ?? ""} ${a.officialEmail} ${a.officialContactEmail ?? ""} ${a.officialPhone} ${hasReferral(a) ? referralName(a) : ""}`
        }
        searchPlaceholder="Search schools, contacts or referrers"
        filters={[
          {
            key: "status",
            label: "Status",
            options: (Object.keys(STATUS) as Status[]).map((s) => ({
              value: s,
              label: STATUS[s].label,
            })),
            match: (a, val) => a.status === val,
          },
          {
            key: "source",
            label: "Source",
            options: [
              { value: "direct", label: "Direct" },
              { value: "referred", label: "Referred" },
              { value: "active", label: "Referral link active" },
              { value: "expired", label: "Referral link expired" },
              ...referralOptions,
            ],
            match: (a, val) => {
              if (val === "direct") return !hasReferral(a);
              if (val === "referred") return hasReferral(a);
              if (val === "active") return hasReferral(a) && referralActive(a);
              if (val === "expired")
                return hasReferral(a) && referralExpired(a);
              return hasReferral(a) && `ref:${referralKey(a)}` === val;
            },
          },
        ]}
        rowActions={(a) => [
          {
            label: "Details",
            icon: <Eye />,
            onSelect: () => setViewingId(a.id),
          },
          a.project
            ? {
                label: "Continue editing the site",
                icon: <Pencil />,
                href: editorHref(a.project.id),
              }
            : {
                label:
                  a.status === "IN_PROGRESS"
                    ? "Start editing the site"
                    : "Start the website",
                icon: <Hammer />,
                onSelect: () => void startProject(a),
                hidden: a.status !== "PENDING" && a.status !== "IN_PROGRESS",
                disabled: starting === a.id,
              },
          {
            label: "Go live and email them",
            icon: <Rocket />,
            onSelect: () => openGoLive(a),
            hidden: !(a.status === "IN_PROGRESS" && a.project),
          },
          "separator",
          {
            label: "Delete",
            icon: <Trash2 />,
            danger: true,
            onSelect: () => void remove(a),
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
        empty={{
          icon: <GraduationCap />,
          title: "No applications yet",
          description:
            "When a school applies for a free website on the We Brand Schools page, it shows up here.",
        }}
      />

      <SidePanel
        open={!!v}
        onOpenChange={(o) => !o && setViewingId(null)}
        width="lg"
        title={v?.schoolName ?? ""}
        description={
          v
            ? `${v.selectedTemplateName} · received ${formatDateTime(v.createdAt)}`
            : undefined
        }
        footer={
          v ? (
            <>
              <Button
                size="sm"
                variant="subtle"
                onClick={() => void remove(v)}
                className="mr-auto text-[#c2410c]"
              >
                <Trash2 aria-hidden className="size-4" /> Delete
              </Button>
              <Button
                size="sm"
                onClick={saveStatus}
                disabled={!statusChanged || saving}
              >
                {saving && (
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                )}
                {status === "LIVE" && v.status !== "LIVE"
                  ? "Go live…"
                  : "Save status"}
              </Button>
            </>
          ) : undefined
        }
      >
        {v && (
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-[10px] bg-white p-4 ring-1 ring-black/[0.06]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold">Where it&apos;s at</h3>
                <StatusPill tone={STATUS[v.status].tone} dot>
                  {STATUS[v.status].label}
                </StatusPill>
              </div>
              <SelectField
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                options={(Object.keys(STATUS) as Status[]).map((s) => ({
                  value: s,
                  label: STATUS[s].label,
                }))}
                hint={
                  status === "LIVE" && v.status !== "LIVE"
                    ? "Going live emails the school their website and portal details."
                    : undefined
                }
              />
              <TextareaField
                label="Team notes"
                rows={4}
                maxLength={4000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                hint="Only the team sees these."
              />
              <div className="flex flex-wrap gap-2">
                {projectAction(v)}
                {v.status === "IN_PROGRESS" && v.project && (
                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={() => openGoLive(v, notes)}
                  >
                    <Rocket aria-hidden className="size-4" /> Go live
                  </Button>
                )}
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-bold">The school</h3>
              <DetailList
                columns={1}
                items={[
                  { label: "About", value: <Long text={v.aboutSchool} /> },
                  { label: "Vision", value: <Long text={v.vision} /> },
                  { label: "Mission", value: <Long text={v.mission} /> },
                  { label: "Core values", value: <Long text={v.coreValues} /> },
                ]}
              />
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-bold">Contacts</h3>
              <DetailList
                items={[
                  {
                    label: "School email",
                    value: <Mail v={v.officialEmail} />,
                  },
                  { label: "School phone", value: <Tel v={v.officialPhone} /> },
                  {
                    label: "Contact person",
                    value:
                      [v.officialContactName, v.officialContactRole]
                        .filter(Boolean)
                        .join(", ") || "Not given",
                  },
                  {
                    label: "Their phone",
                    value: v.officialContactPhone ? (
                      <Tel v={v.officialContactPhone} />
                    ) : (
                      "Not given"
                    ),
                  },
                  {
                    label: "Their email",
                    value: v.officialContactEmail ? (
                      <Mail v={v.officialContactEmail} />
                    ) : (
                      "Not given"
                    ),
                  },
                  {
                    label: "Current website",
                    value: v.officialWebsiteUrl || "None",
                  },
                  { label: "Address", value: v.officialAddress },
                ]}
              />
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-bold">Domain</h3>
              <DetailList
                items={[
                  { label: "Choice", value: domainLabel(v) },
                  v.domainChoice === "HAS_DOMAIN"
                    ? {
                        label: "Their domain",
                        value: v.existingDomain || "Not given",
                      }
                    : {
                        label: "Names they'd like",
                        value:
                          [v.preferredDomain1, v.preferredDomain2]
                            .filter(Boolean)
                            .join(", ") || "Not given",
                      },
                ]}
              />
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold">How they found us</h3>
                <StatusPill tone={referralState(v).tone}>
                  {referralState(v).label}
                </StatusPill>
              </div>
              {hasReferral(v) ? (
                <DetailList
                  items={[
                    { label: "Referred by", value: referralName(v) },
                    {
                      label: "Link",
                      value: referralSlug(v)
                        ? `/r/${referralSlug(v)}`
                        : (referralCode(v) ?? "Not recorded"),
                    },
                    {
                      label: "Their email",
                      value:
                        v.referralEmailSnapshot ??
                        v.referralLink?.email ??
                        "Not given",
                    },
                    {
                      label: "Location",
                      value:
                        v.referralLocationSnapshot ??
                        v.referralLink?.location ??
                        "Not given",
                    },
                  ]}
                />
              ) : (
                <p className="text-surface-muted text-sm">
                  They applied directly, not through a referral link.
                </p>
              )}
            </section>
          </div>
        )}
      </SidePanel>

      <Modal
        open={!!goLive}
        onOpenChange={(o) => !o && !sending && setGoLive(null)}
        title="Go live and email the school"
        description="The school's contacts get their website and portal sign-in. Whoever referred them only gets the website address."
        size="md"
        footer={
          <>
            <Button
              size="sm"
              variant="subtle"
              onClick={() => setGoLive(null)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={sendGoLive}
              disabled={
                sending ||
                !goLive?.websiteUrl.trim() ||
                !goLive?.portalUrl.trim() ||
                !goLive?.portalPassword.trim()
              }
            >
              {sending && (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              )}
              Go live and send
            </Button>
          </>
        }
      >
        {goLive && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void sendGoLive();
            }}
          >
            <TextField
              label="Website address"
              type="url"
              value={goLive.websiteUrl}
              onChange={(e) =>
                setGoLive({ ...goLive, websiteUrl: e.target.value })
              }
              placeholder="https://schoolname.com"
              required
            />
            <TextField
              label="Portal address"
              type="url"
              value={goLive.portalUrl}
              onChange={(e) =>
                setGoLive({ ...goLive, portalUrl: e.target.value })
              }
              placeholder="https://schoolname.com/portal"
              required
            />
            <TextField
              label="Portal password"
              value={goLive.portalPassword}
              onChange={(e) =>
                setGoLive({ ...goLive, portalPassword: e.target.value })
              }
              placeholder="A temporary password"
              autoComplete="off"
              required
            />
            <TextareaField
              label="Short message"
              rows={3}
              maxLength={1000}
              value={goLive.message}
              onChange={(e) =>
                setGoLive({ ...goLive, message: e.target.value })
              }
            />
          </form>
        )}
      </Modal>
    </>
  );
}

function Long({ text }: { text: string }) {
  return text?.trim() ? (
    <span className="leading-relaxed whitespace-pre-line">{text}</span>
  ) : (
    <span className="text-surface-muted">Not given</span>
  );
}
const Mail = ({ v }: { v: string }) => (
  <a href={`mailto:${v}`} className="dx-link text-royal break-all">
    {v}
  </a>
);
const Tel = ({ v }: { v: string }) => (
  <a href={`tel:${v.replace(/\s+/g, "")}`} className="dx-link text-royal">
    {v}
  </a>
);
