"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Loader2,
  Trash2,
  MoreHorizontal,
  Play,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BulkActionsBar } from "@/components/admin/bulk-actions-bar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteSchoolWebsiteApplication,
  deleteSchoolWebsiteApplications,
  startSchoolWebsiteProject,
  updateSchoolWebsiteApplicationStatus,
  type SchoolWebsiteApplicationRow,
} from "../actions";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "LIVE", label: "Live" },
  { value: "DECLINED", label: "Declined" },
] as const;

type ReferralFilterValue =
  | "ALL"
  | "DIRECT"
  | "REFERRED"
  | "ACTIVE"
  | "EXPIRED"
  | `REFERRAL:${string}`;

const DEFAULT_GO_LIVE_ADMIN_MESSAGE =
  "Please change your portal password after your first login.";

function statusClassName(status: SchoolWebsiteApplicationRow["status"]) {
  switch (status) {
    case "PENDING":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";
    case "IN_PROGRESS":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";
    case "LIVE":
      return "border-green-500/20 bg-green-500/10 text-green-400";
    case "DECLINED":
      return "border-red-500/20 bg-red-500/10 text-red-400";
    default:
      return "border-[#2a2a2a] bg-[#0d0d0d] text-[#888]";
  }
}

function domainStateLabel(application: SchoolWebsiteApplicationRow) {
  return application.domainChoice === "HAS_DOMAIN"
    ? "Has domain"
    : "Needs domain";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function hasReferralSource(application: SchoolWebsiteApplicationRow) {
  return Boolean(
    application.referralLinkId ||
    application.referralCodeSnapshot ||
    application.referralNameSnapshot ||
    application.referralSlugSnapshot,
  );
}

function getReferralName(application: SchoolWebsiteApplicationRow) {
  return (
    application.referralNameSnapshot ??
    application.referralLink?.displayName ??
    "Referral"
  );
}

function getReferralSlug(application: SchoolWebsiteApplicationRow) {
  return (
    application.referralSlugSnapshot ?? application.referralLink?.slug ?? null
  );
}

function getReferralCode(application: SchoolWebsiteApplicationRow) {
  return (
    application.referralCodeSnapshot ?? application.referralLink?.code ?? null
  );
}

function getReferralEmail(application: SchoolWebsiteApplicationRow) {
  return (
    application.referralEmailSnapshot ?? application.referralLink?.email ?? null
  );
}

function getReferralLocation(application: SchoolWebsiteApplicationRow) {
  return (
    application.referralLocationSnapshot ??
    application.referralLink?.location ??
    null
  );
}

function getReferralFilterKey(application: SchoolWebsiteApplicationRow) {
  return (
    application.referralLinkId ??
    getReferralCode(application) ??
    getReferralSlug(application) ??
    null
  );
}

function isReferralExpired(application: SchoolWebsiteApplicationRow) {
  return Boolean(
    application.referralLink?.expiresAt &&
    new Date(application.referralLink.expiresAt).getTime() <= Date.now(),
  );
}

function isReferralActive(application: SchoolWebsiteApplicationRow) {
  const referral = application.referralLink;
  return Boolean(
    referral &&
    referral.status === "ACTIVE" &&
    !referral.deletedAt &&
    !isReferralExpired(application),
  );
}

function referralBadgeClassName(application: SchoolWebsiteApplicationRow) {
  if (!hasReferralSource(application)) {
    return "border-[#2a2a2a] bg-[#0d0d0d] text-[#888]";
  }

  if (isReferralExpired(application)) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  if (isReferralActive(application)) {
    return "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";
  }

  return "border-blue-500/20 bg-blue-500/10 text-blue-300";
}

function referralStatusLabel(application: SchoolWebsiteApplicationRow) {
  if (!hasReferralSource(application)) return "Direct";
  if (isReferralExpired(application)) return "Expired referral";
  if (isReferralActive(application)) return "Active referral";
  return "Referred";
}

function normalizeUrlForForm(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function getSuggestedWebsiteUrl(application: SchoolWebsiteApplicationRow) {
  return normalizeUrlForForm(
    application.existingDomain ??
      application.preferredDomain1 ??
      application.officialWebsiteUrl,
  );
}

function ApplicationDetailDialog({
  application,
  onClose,
  onDelete,
  onGoLive,
}: {
  application: SchoolWebsiteApplicationRow | null;
  onClose: () => void;
  onDelete: (application: SchoolWebsiteApplicationRow) => void;
  onGoLive: (
    application: SchoolWebsiteApplicationRow,
    adminNotes: string,
  ) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SchoolWebsiteApplicationRow["status"]>(
    application?.status ?? "PENDING",
  );
  const [adminNotes, setAdminNotes] = useState(application?.adminNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStatus(application?.status ?? "PENDING");
    setAdminNotes(application?.adminNotes ?? "");
  }, [application]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!application) return;

    if (status === "LIVE" && application.status !== "LIVE") {
      onGoLive(application, adminNotes);
      return;
    }

    setIsSaving(true);
    const result = await updateSchoolWebsiteApplicationStatus(application.id, {
      status,
      adminNotes,
    });
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
    onClose();
  };

  return (
    <Dialog open={Boolean(application)} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] overflow-y-auto border-[#222] bg-[#111] text-white sm:max-w-4xl">
        {application ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">
                {application.schoolName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="min-w-0 rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#666]">
                    Template
                  </p>
                  <p className="mt-2 break-words text-sm font-medium text-white">
                    {application.selectedTemplateName}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#666]">
                    Contact Person
                  </p>
                  <p className="mt-2 break-words text-sm font-medium text-white">
                    {application.officialContactName || "Not provided"}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#666]">
                    Domain State
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {domainStateLabel(application)}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#666]">
                    Submitted
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {formatDate(application.createdAt)}
                  </p>
                </div>
              </div>

              <section className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">
                    Referral Source
                  </h3>
                  <Badge
                    variant="outline"
                    className={referralBadgeClassName(application)}
                  >
                    {referralStatusLabel(application)}
                  </Badge>
                </div>

                {hasReferralSource(application) ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        Name
                      </p>
                      <p className="mt-2 break-words text-sm text-white">
                        {getReferralName(application)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        Slug / Code
                      </p>
                      <p className="mt-2 break-all text-sm text-white">
                        {getReferralSlug(application)
                          ? `/r/${getReferralSlug(application)}`
                          : "No slug snapshot"}
                      </p>
                      <p className="mt-1 break-all text-xs text-[#777]">
                        {getReferralCode(application) ?? "No code snapshot"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        Email
                      </p>
                      <p className="mt-2 break-all text-sm text-white">
                        {getReferralEmail(application) ?? "Not provided"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        Location
                      </p>
                      <p className="mt-2 break-words text-sm text-white">
                        {getReferralLocation(application) ?? "Not provided"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[#888]">
                    This application was submitted directly, without referral
                    attribution.
                  </p>
                )}
              </section>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-5">
                  <h3 className="text-sm font-semibold text-white">
                    School Profile
                  </h3>
                  <div className="mt-4 space-y-4 text-sm text-[#cfcfcf]">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        About School
                      </p>
                      <p className="mt-2 leading-7">
                        {application.aboutSchool}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        Vision
                      </p>
                      <p className="mt-2 leading-7">{application.vision}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        Mission
                      </p>
                      <p className="mt-2 leading-7">{application.mission}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        Core Values
                      </p>
                      <p className="mt-2 leading-7">{application.coreValues}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-5">
                  <h3 className="text-sm font-semibold text-white">
                    Official Contacts
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        School Email
                      </p>
                      <p className="mt-2 break-all text-sm text-white">
                        {application.officialEmail}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        School Phone
                      </p>
                      <p className="mt-2 break-words text-sm text-white">
                        {application.officialPhone}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        Contact Name
                      </p>
                      <p className="mt-2 break-words text-sm text-white">
                        {application.officialContactName || "Not provided"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        Contact Role
                      </p>
                      <p className="mt-2 break-words text-sm text-white">
                        {application.officialContactRole || "Not provided"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        Contact Phone
                      </p>
                      <p className="mt-2 break-words text-sm text-white">
                        {application.officialContactPhone || "Not provided"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                        Contact Email
                      </p>
                      <p className="mt-2 break-all text-sm text-white">
                        {application.officialContactEmail || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                      Address
                    </p>
                    <p className="mt-2 break-words text-sm leading-7 text-white">
                      {application.officialAddress}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                      Website
                    </p>
                    <p className="mt-2 break-all text-sm text-white">
                      {application.officialWebsiteUrl || "Not provided"}
                    </p>
                  </div>
                </section>
              </div>

              <section className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-5">
                <h3 className="text-sm font-semibold text-white">
                  Domain Information
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                      Domain Choice
                    </p>
                    <p className="mt-2 break-words text-sm text-white">
                      {domainStateLabel(application)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                      Existing Domain
                    </p>
                    <p className="mt-2 break-all text-sm text-white">
                      {application.existingDomain || "Not provided"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                      Preferred Domains
                    </p>
                    <p className="mt-2 break-all text-sm text-white">
                      {[
                        application.preferredDomain1,
                        application.preferredDomain2,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Not provided"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">
                    Delivery Status
                  </h3>
                  <Badge
                    variant="outline"
                    className={statusClassName(application.status)}
                  >
                    {application.status}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div>
                    <Label className="mb-1.5 block text-xs text-[#888]">
                      Status
                    </Label>
                    <Select
                      value={status}
                      onValueChange={(value) =>
                        setStatus(
                          value as SchoolWebsiteApplicationRow["status"],
                        )
                      }
                    >
                      <SelectTrigger className="w-full border-[#2a2a2a] bg-[#111] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-[#222] bg-[#111] text-white">
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-xs text-[#888]">
                      Admin Notes
                    </Label>
                    <Textarea
                      rows={5}
                      value={adminNotes}
                      onChange={(event) => setAdminNotes(event.target.value)}
                      className="resize-none border-[#2a2a2a] bg-[#111] text-white placeholder-[#444]"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onDelete(application)}
                    className="border-red-500/20 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Application
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-cyan-500 text-black hover:bg-cyan-400"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Status"
                    )}
                  </Button>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function ApplicationsManager({
  applications,
}: {
  applications: SchoolWebsiteApplicationRow[];
}) {
  const router = useRouter();
  const [selectedApplication, setSelectedApplication] =
    useState<SchoolWebsiteApplicationRow | null>(null);
  const [quickActionId, setQuickActionId] = useState<string | null>(null);
  const [referralFilter, setReferralFilter] =
    useState<ReferralFilterValue>("ALL");
  const [deletingApplication, setDeletingApplication] =
    useState<SchoolWebsiteApplicationRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [goLiveApplication, setGoLiveApplication] =
    useState<SchoolWebsiteApplicationRow | null>(null);
  const [goLiveAdminNotes, setGoLiveAdminNotes] = useState("");
  const [goLiveWebsiteUrl, setGoLiveWebsiteUrl] = useState("");
  const [goLivePortalUrl, setGoLivePortalUrl] = useState("");
  const [goLivePortalPassword, setGoLivePortalPassword] = useState("");
  const [goLiveAdminMessage, setGoLiveAdminMessage] = useState(
    DEFAULT_GO_LIVE_ADMIN_MESSAGE,
  );
  const [isSendingGoLive, setIsSendingGoLive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const toggleSelectAll = () => {
    const currentFilteredIds = filteredApplications.map((app) => app.id);
    const allSelected = currentFilteredIds.every((id) =>
      selectedIds.includes(id),
    );
    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !currentFilteredIds.includes(id)),
      );
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...currentFilteredIds])),
      );
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;

    setIsBulkDeleting(true);
    const result = await deleteSchoolWebsiteApplications(selectedIds);
    setIsBulkDeleting(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setSelectedIds([]);
    setShowBulkDeleteDialog(false);
    if (selectedApplication && selectedIds.includes(selectedApplication.id)) {
      setSelectedApplication(null);
    }
    router.refresh();
  };

  const referralOptions = useMemo(() => {
    const options = new Map<
      string,
      {
        key: string;
        label: string;
        detail: string;
      }
    >();

    applications.forEach((application) => {
      if (!hasReferralSource(application)) return;

      const key = getReferralFilterKey(application);
      if (!key || options.has(key)) return;

      const slug = getReferralSlug(application);
      const code = getReferralCode(application);
      options.set(key, {
        key,
        label: getReferralName(application),
        detail: slug ? `/r/${slug}` : code ? code : "Referral source",
      });
    });

    return Array.from(options.values()).sort((first, second) =>
      first.label.localeCompare(second.label),
    );
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const hasReferral = hasReferralSource(application);

      if (referralFilter === "ALL") return true;
      if (referralFilter === "DIRECT") return !hasReferral;
      if (referralFilter === "REFERRED") return hasReferral;
      if (referralFilter === "ACTIVE") {
        return hasReferral && isReferralActive(application);
      }
      if (referralFilter === "EXPIRED") {
        return hasReferral && isReferralExpired(application);
      }
      if (referralFilter.startsWith("REFERRAL:")) {
        return (
          hasReferral &&
          getReferralFilterKey(application) ===
            referralFilter.replace("REFERRAL:", "")
        );
      }

      return true;
    });
  }, [applications, referralFilter]);

  const openProjectEditor = (projectId: string) => {
    router.push(`/admin/we-brand-schools/projects/${projectId}/editor`);
  };

  const startProject = async (application: SchoolWebsiteApplicationRow) => {
    setQuickActionId(`${application.id}:START_PROJECT`);
    const result = await startSchoolWebsiteProject(application.id);
    setQuickActionId(null);

    if (!result.success || !result.projectId) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
    router.push(
      result.redirectHref ??
        `/admin/we-brand-schools/projects/${result.projectId}/editor`,
    );
  };

  const openGoLiveModal = (
    application: SchoolWebsiteApplicationRow,
    adminNotes = application.adminNotes ?? "",
  ) => {
    setGoLiveApplication(application);
    setGoLiveAdminNotes(adminNotes);
    setGoLiveWebsiteUrl(getSuggestedWebsiteUrl(application));
    setGoLivePortalUrl("");
    setGoLivePortalPassword("");
    setGoLiveAdminMessage(DEFAULT_GO_LIVE_ADMIN_MESSAGE);
  };

  const closeGoLiveModal = () => {
    if (isSendingGoLive) return;
    setGoLiveApplication(null);
  };

  const handleGoLiveSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!goLiveApplication) return;

    setIsSendingGoLive(true);
    const result = await updateSchoolWebsiteApplicationStatus(
      goLiveApplication.id,
      {
        status: "LIVE",
        adminNotes: goLiveAdminNotes,
        goLiveDetails: {
          websiteUrl: goLiveWebsiteUrl,
          portalUrl: goLivePortalUrl,
          portalPassword: goLivePortalPassword,
          adminMessage: goLiveAdminMessage,
        },
      },
    );
    setIsSendingGoLive(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setGoLiveApplication(null);
    if (selectedApplication?.id === goLiveApplication.id) {
      setSelectedApplication(null);
    }
    router.refresh();
  };

  const handleDeleteApplication = async () => {
    if (!deletingApplication) return;

    setIsDeleting(true);
    const result = await deleteSchoolWebsiteApplication(deletingApplication.id);
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    if (selectedApplication?.id === deletingApplication.id) {
      setSelectedApplication(null);
    }
    setDeletingApplication(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#222] bg-[#111] p-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Label className="mb-1.5 block text-xs uppercase tracking-[0.22em] text-[#666]">
            Referral Filter
          </Label>
          <Select
            value={referralFilter}
            onValueChange={(value) =>
              setReferralFilter(value as ReferralFilterValue)
            }
          >
            <SelectTrigger className="w-full border-[#2a2a2a] bg-[#0d0d0d] text-white md:w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-[#222] bg-[#111] text-white">
              <SelectItem value="ALL">All applications</SelectItem>
              <SelectItem value="DIRECT">Direct only</SelectItem>
              <SelectItem value="REFERRED">Referred only</SelectItem>
              <SelectItem value="ACTIVE">Active referral</SelectItem>
              <SelectItem value="EXPIRED">Expired referral</SelectItem>
              {referralOptions.map((option) => (
                <SelectItem key={option.key} value={`REFERRAL:${option.key}`}>
                  {option.label} - {option.detail}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-[#888]">
          Showing {filteredApplications.length} of {applications.length}{" "}
          applications
        </p>
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onDeleteSelected={() => setShowBulkDeleteDialog(true)}
        isDeleting={isBulkDeleting}
        itemLabel="applications"
      />

      <div className="overflow-hidden rounded-2xl border border-[#222] bg-[#111]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#222] hover:bg-transparent">
              <TableHead className="w-12 px-4">
                <Checkbox
                  checked={
                    filteredApplications.length > 0 &&
                    filteredApplications.every((app) =>
                      selectedIds.includes(app.id),
                    )
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all applications"
                />
              </TableHead>
              <TableHead className="text-[#888]">School Name</TableHead>
              <TableHead className="text-[#888]">Template</TableHead>
              <TableHead className="text-[#888]">Contact Person</TableHead>
              <TableHead className="text-[#888]">Referral</TableHead>
              <TableHead className="text-[#888]">Domain State</TableHead>
              <TableHead className="text-[#888]">Status</TableHead>
              <TableHead className="text-[#888]">Date Submitted</TableHead>
              <TableHead className="text-right text-[#888]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-sm text-[#666]"
                >
                  {applications.length === 0
                    ? "No school website applications have been submitted yet."
                    : "No applications match this referral filter."}
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((application) => {
                const isSelected = selectedIds.includes(application.id);
                return (
                  <TableRow
                    key={application.id}
                    className={cn(
                      "cursor-pointer border-[#222] hover:bg-[#171717]",
                      isSelected && "bg-cyan-950/10",
                    )}
                    onClick={() => setSelectedApplication(application)}
                  >
                    <TableCell
                      className="px-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectOne(application.id)}
                        aria-label={`Select ${application.schoolName}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {application.schoolName}
                    </TableCell>
                    <TableCell className="text-[#b3b3b3]">
                      {application.selectedTemplateName}
                    </TableCell>
                    <TableCell className="text-[#b3b3b3]">
                      {application.officialContactName || "Not provided"}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[220px] space-y-1">
                        <Badge
                          variant="outline"
                          className={referralBadgeClassName(application)}
                        >
                          {referralStatusLabel(application)}
                        </Badge>
                        {hasReferralSource(application) ? (
                          <>
                            <p className="truncate text-sm text-white">
                              {getReferralName(application)}
                            </p>
                            <p className="truncate text-xs text-[#777]">
                              {getReferralSlug(application)
                                ? `/r/${getReferralSlug(application)}`
                                : getReferralCode(application)}
                            </p>
                            <p className="truncate text-xs text-[#777]">
                              {getReferralEmail(application) ?? "No email"}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-[#777]">
                            No referral link
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#b3b3b3]">
                      {domainStateLabel(application)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusClassName(application.status)}
                      >
                        {application.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#888]">
                      {formatDate(application.createdAt)}
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#888] hover:bg-[#1a1a1a] hover:text-white"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 border-[#222] bg-[#111] text-white"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                setSelectedApplication(application)
                              }
                              className="cursor-pointer hover:bg-[#1a1a1a]"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            {application.project ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  openProjectEditor(application.project!.id)
                                }
                                className="cursor-pointer hover:bg-[#1a1a1a] text-blue-400"
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Continue editing
                              </DropdownMenuItem>
                            ) : application.status === "PENDING" ||
                              application.status === "IN_PROGRESS" ? (
                              <DropdownMenuItem
                                onClick={() => void startProject(application)}
                                disabled={
                                  quickActionId ===
                                  `${application.id}:START_PROJECT`
                                }
                                className="cursor-pointer hover:bg-[#1a1a1a] text-blue-400"
                              >
                                {quickActionId ===
                                `${application.id}:START_PROJECT` ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Play className="mr-2 h-4 w-4" />
                                )}
                                {application.status === "IN_PROGRESS"
                                  ? "Start editing"
                                  : "Start project"}
                              </DropdownMenuItem>
                            ) : null}
                            {application.status === "IN_PROGRESS" &&
                            application.project ? (
                              <DropdownMenuItem
                                onClick={() => openGoLiveModal(application)}
                                className="cursor-pointer hover:bg-[#1a1a1a] text-emerald-400"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Go live
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator className="bg-[#222]" />
                            <DropdownMenuItem
                              onClick={() =>
                                setDeletingApplication(application)
                              }
                              className="cursor-pointer text-red-400 hover:bg-red-950/20 hover:text-red-300"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete application
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ApplicationDetailDialog
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onDelete={(application) => setDeletingApplication(application)}
        onGoLive={openGoLiveModal}
      />

      <Dialog
        open={Boolean(goLiveApplication)}
        onOpenChange={(open) => {
          if (!open) {
            closeGoLiveModal();
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto border-[#222] bg-[#111] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Go live and send emails</DialogTitle>
            <DialogDescription className="text-[#888]">
              Send website access to the school contacts. Referral owners only
              receive the public website URL.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleGoLiveSubmit}>
            <div className="space-y-2">
              <Label htmlFor="go-live-website-url" className="text-[#cfcfcf]">
                Website URL
              </Label>
              <Input
                id="go-live-website-url"
                type="url"
                value={goLiveWebsiteUrl}
                onChange={(event) => setGoLiveWebsiteUrl(event.target.value)}
                placeholder="https://schoolname.com"
                required
                className="border-[#2a2a2a] bg-[#0d0d0d] text-white placeholder-[#555]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="go-live-portal-url" className="text-[#cfcfcf]">
                Portal URL
              </Label>
              <Input
                id="go-live-portal-url"
                type="url"
                value={goLivePortalUrl}
                onChange={(event) => setGoLivePortalUrl(event.target.value)}
                placeholder="https://schoolname.com/portal"
                required
                className="border-[#2a2a2a] bg-[#0d0d0d] text-white placeholder-[#555]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="go-live-portal-password"
                className="text-[#cfcfcf]"
              >
                Portal Password
              </Label>
              <Input
                id="go-live-portal-password"
                type="text"
                value={goLivePortalPassword}
                onChange={(event) =>
                  setGoLivePortalPassword(event.target.value)
                }
                placeholder="Temporary portal password"
                required
                className="border-[#2a2a2a] bg-[#0d0d0d] text-white placeholder-[#555]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="go-live-admin-message" className="text-[#cfcfcf]">
                Short Message
              </Label>
              <Textarea
                id="go-live-admin-message"
                rows={4}
                value={goLiveAdminMessage}
                onChange={(event) => setGoLiveAdminMessage(event.target.value)}
                className="resize-none border-[#2a2a2a] bg-[#0d0d0d] text-white placeholder-[#555]"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeGoLiveModal}
                disabled={isSendingGoLive}
                className="border-[#2a2a2a] bg-transparent text-[#888] hover:bg-[#1a1a1a] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSendingGoLive}
                className="bg-green-600 text-white hover:bg-green-500"
              >
                {isSendingGoLive ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Emails"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingApplication)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingApplication(null);
          }
        }}
      >
        <AlertDialogContent className="border-[#222] bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#777]">
              This will permanently delete{" "}
              {deletingApplication?.schoolName
                ? `${deletingApplication.schoolName}'s application`
                : "this application"}
              {deletingApplication?.project
                ? " and its linked website project/editor content."
                : "."}{" "}
              Referral reports keep their event history, but this application
              will no longer appear here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-[#2a2a2a] bg-transparent text-[#888] hover:bg-[#1a1a1a] hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteApplication();
              }}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete application"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={(open) => {
          if (!open && !isBulkDeleting) {
            setShowBulkDeleteDialog(false);
          }
        }}
      >
        <AlertDialogContent className="border-[#222] bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.length} application
              {selectedIds.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#777]">
              This will permanently delete the selected {selectedIds.length}{" "}
              school website application{selectedIds.length === 1 ? "" : "s"}{" "}
              and any associated website projects. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isBulkDeleting}
              className="border-[#2a2a2a] bg-transparent text-[#888] hover:bg-[#1a1a1a] hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isBulkDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleBulkDelete();
              }}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete selected"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
