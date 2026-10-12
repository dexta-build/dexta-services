"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Copy,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { referralLinkSchema, type ReferralLinkInput } from "@/lib/validators";
import {
  createReferralLink,
  deleteReferralLink,
  deleteReferralLinks,
  updateReferralLink,
  updateReferralLinkStatus,
  type ReferralLinkRow,
} from "../actions";

type ReferralLinkFormValues = {
  displayName: string;
  slug: string;
  email: string;
  location: string;
  expiresAt: string;
  status: ReferralLinkInput["status"];
  notificationEnabled: boolean;
};

type ReferralReportFilter =
  | "ALL"
  | "ACTIVE"
  | "INACTIVE"
  | "EXPIRED"
  | "DELETED"
  | "HAS_APPLICATIONS"
  | "HAS_LIVE_SITES";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

function sanitizeReferralSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatConversionRate(value: number | null) {
  if (value === null) return "No visits";
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDateTimeLocal(value: Date | string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getReferralHref(slug: string) {
  if (typeof window === "undefined") return `/webrandschools/r/${slug}`;
  return `${window.location.origin}/webrandschools/r/${slug}`;
}

function isExpired(referral: ReferralLinkRow) {
  return Boolean(
    !referral.deletedAt &&
    referral.expiresAt &&
    new Date(referral.expiresAt).getTime() <= Date.now(),
  );
}

function isDeleted(referral: ReferralLinkRow) {
  return Boolean(referral.deletedAt);
}

function statusClassName(referral: ReferralLinkRow) {
  if (isDeleted(referral)) {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  if (isExpired(referral)) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  return referral.status === "ACTIVE"
    ? "border-green-500/20 bg-green-500/10 text-green-400"
    : "border-[#2a2a2a] bg-[#0d0d0d] text-[#888]";
}

function statusLabel(referral: ReferralLinkRow) {
  if (isDeleted(referral)) return "Deleted";
  if (isExpired(referral)) return "Expired";
  return referral.status === "ACTIVE" ? "Active" : "Inactive";
}

function notificationClassName(referral: ReferralLinkRow) {
  if (!referral.notificationEnabled) {
    return "border-[#2a2a2a] bg-[#0d0d0d] text-[#888]";
  }

  switch (referral.latestNotificationStatus) {
    case "SENT":
      return "border-green-500/20 bg-green-500/10 text-green-400";
    case "FAILED":
      return "border-red-500/20 bg-red-500/10 text-red-300";
    case "SKIPPED":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";
    default:
      return "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";
  }
}

function notificationLabel(referral: ReferralLinkRow) {
  if (!referral.notificationEnabled) return "Disabled";
  if (!referral.latestNotificationStatus) return "Enabled";
  return referral.latestNotificationStatus
    .toLowerCase()
    .replace(/^\w/, (char) => char.toUpperCase());
}

function ReferralForm({
  initialData,
  onSubmit,
}: {
  initialData?: ReferralLinkRow | null;
  onSubmit: (data: ReferralLinkInput) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReferralLinkFormValues, unknown, ReferralLinkInput>({
    resolver: zodResolver(referralLinkSchema) as Resolver<
      ReferralLinkFormValues,
      unknown,
      ReferralLinkInput
    >,
    defaultValues: {
      displayName: initialData?.displayName ?? "",
      slug: initialData?.slug ?? "",
      email: initialData?.email ?? "",
      location: initialData?.location ?? "",
      expiresAt: formatDateTimeLocal(initialData?.expiresAt ?? null),
      status: initialData?.status ?? "ACTIVE",
      notificationEnabled: initialData?.notificationEnabled ?? true,
    },
  });

  useEffect(() => {
    reset({
      displayName: initialData?.displayName ?? "",
      slug: initialData?.slug ?? "",
      email: initialData?.email ?? "",
      location: initialData?.location ?? "",
      expiresAt: formatDateTimeLocal(initialData?.expiresAt ?? null),
      status: initialData?.status ?? "ACTIVE",
      notificationEnabled: initialData?.notificationEnabled ?? true,
    });
  }, [initialData, reset]);

  const slug = watch("slug") ?? "";
  const publicLink = slug ? `/webrandschools/r/${slug}` : "/webrandschools/r/";

  return (
    <form
      onSubmit={handleSubmit(async (data) => onSubmit(data))}
      className="max-h-[78vh] space-y-4 overflow-y-auto pr-1"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs text-[#888]">
            Name or organization name
          </Label>
          <Input
            className="border-[#2a2a2a] bg-[#0d0d0d] text-white"
            maxLength={160}
            {...register("displayName")}
          />
          <FieldError message={errors.displayName?.message} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-[#888]">
            Referral owner email
          </Label>
          <Input
            type="email"
            className="border-[#2a2a2a] bg-[#0d0d0d] text-white"
            maxLength={254}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <Label className="mb-1.5 block text-xs text-[#888]">
            Referral slug
          </Label>
          <Input
            className="border-[#2a2a2a] bg-[#0d0d0d] text-white"
            maxLength={80}
            value={slug}
            onChange={(event) =>
              setValue("slug", sanitizeReferralSlug(event.target.value), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            placeholder="graceschools"
          />
          <p className="mt-1 text-xs text-[#666]">{publicLink}</p>
          <FieldError message={errors.slug?.message} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-[#888]">
            State/city or location
          </Label>
          <Input
            className="border-[#2a2a2a] bg-[#0d0d0d] text-white"
            maxLength={160}
            placeholder="Lagos"
            {...register("location")}
          />
          <FieldError message={errors.location?.message} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs text-[#888]">
            Expiration date
          </Label>
          <Input
            type="datetime-local"
            className="border-[#2a2a2a] bg-[#0d0d0d] text-white"
            {...register("expiresAt")}
          />
          <FieldError message={errors.expiresAt?.message} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-[#888]">Status</Label>
          <Select
            value={watch("status")}
            onValueChange={(value) =>
              setValue("status", value as ReferralLinkInput["status"], {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="border-[#2a2a2a] bg-[#0d0d0d] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-[#2a2a2a] bg-[#111]">
              <SelectItem value="ACTIVE" className="text-white">
                Active
              </SelectItem>
              <SelectItem value="INACTIVE" className="text-white">
                Inactive
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError message={errors.status?.message} />
        </div>
      </div>

      <label className="flex items-center justify-between gap-4 rounded-xl border border-[#222] bg-[#0d0d0d] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">Email notifications</p>
          <p className="mt-1 text-xs leading-5 text-[#666]">
            Send updates to the referral owner when future referral events are
            connected.
          </p>
        </div>
        <Switch
          checked={watch("notificationEnabled")}
          onCheckedChange={(checked) =>
            setValue("notificationEnabled", checked, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </label>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save referral link"}
        </Button>
      </div>
    </form>
  );
}

function ReferralDetailDialog({
  referral,
  onClose,
  onCopy,
}: {
  referral: ReferralLinkRow | null;
  onClose: () => void;
  onCopy: (referral: ReferralLinkRow) => void;
}) {
  return (
    <Dialog
      open={Boolean(referral)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#222] bg-[#111] text-white sm:max-w-4xl">
        {referral ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">
                {referral.displayName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusClassName(referral)}>
                  {statusLabel(referral)}
                </Badge>
                <Badge className={notificationClassName(referral)}>
                  Notifications: {notificationLabel(referral)}
                </Badge>
              </div>

              <section className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs tracking-[0.22em] text-[#666] uppercase">
                      Referral Link
                    </p>
                    <p className="mt-2 break-all text-sm text-cyan-300">
                      {getReferralHref(referral.slug)}
                    </p>
                    <p className="mt-2 break-all text-xs text-[#777]">
                      Stable code: {referral.code}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onCopy(referral)}
                    className="shrink-0 border-[#2a2a2a] text-[#888] hover:bg-[#1a1a1a] hover:text-white"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="min-w-0 rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-xs tracking-[0.22em] text-[#666] uppercase">
                    Email
                  </p>
                  <p className="mt-2 break-all text-sm text-white">
                    {referral.email}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-xs tracking-[0.22em] text-[#666] uppercase">
                    Location
                  </p>
                  <p className="mt-2 break-words text-sm text-white">
                    {referral.location || "Not provided"}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-xs tracking-[0.22em] text-[#666] uppercase">
                    Expiration
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {referral.expiresAt
                      ? formatDate(referral.expiresAt)
                      : "No expiry"}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-xs tracking-[0.22em] text-[#666] uppercase">
                    Created
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {formatDate(referral.createdAt)}
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-5">
                <h3 className="text-sm font-semibold text-white">
                  Performance
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <p className="text-xs tracking-[0.22em] text-[#666] uppercase">
                      Visits
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCount(referral.visitCount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.22em] text-[#666] uppercase">
                      Selections
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCount(referral.templateSelectionCount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.22em] text-[#666] uppercase">
                      Applications
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCount(referral.applicationCount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.22em] text-[#666] uppercase">
                      Live Sites
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCount(referral.liveSiteCount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.22em] text-[#666] uppercase">
                      Conversion
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatConversionRate(referral.conversionRate)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-xs tracking-[0.22em] text-[#666] uppercase">
                    Last Activity
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {referral.lastActivityAt
                      ? formatDate(referral.lastActivityAt)
                      : "No activity yet"}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-xs tracking-[0.22em] text-[#666] uppercase">
                    Latest Notification
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {notificationLabel(referral)}
                  </p>
                  <p className="mt-1 text-xs text-[#777]">
                    {referral.latestNotificationAt
                      ? formatDate(referral.latestNotificationAt)
                      : "No notification recorded"}
                  </p>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function ReferralsManager({
  referrals,
}: {
  referrals: ReferralLinkRow[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ReferralLinkRow | null>(null);
  const [deleting, setDeleting] = useState<ReferralLinkRow | null>(null);
  const [viewing, setViewing] = useState<ReferralLinkRow | null>(null);
  const [reportFilter, setReportFilter] = useState<ReferralReportFilter>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const filteredReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      switch (reportFilter) {
        case "ACTIVE":
          return (
            referral.status === "ACTIVE" &&
            !isExpired(referral) &&
            !isDeleted(referral)
          );
        case "INACTIVE":
          return (
            referral.status === "INACTIVE" &&
            !isExpired(referral) &&
            !isDeleted(referral)
          );
        case "EXPIRED":
          return isExpired(referral);
        case "DELETED":
          return isDeleted(referral);
        case "HAS_APPLICATIONS":
          return referral.applicationCount > 0;
        case "HAS_LIVE_SITES":
          return referral.liveSiteCount > 0;
        case "ALL":
        default:
          return true;
      }
    });
  }, [referrals, reportFilter]);

  const refresh = () => router.refresh();

  const toggleSelectAll = () => {
    const currentFilteredIds = filteredReferrals.map((r) => r.id);
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
    const result = await deleteReferralLinks(selectedIds);
    setIsBulkDeleting(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setSelectedIds([]);
    setShowBulkDeleteDialog(false);
    refresh();
  };

  const handleCreate = async (payload: ReferralLinkInput) => {
    const result = await createReferralLink(payload);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setCreating(false);
    refresh();
  };

  const handleUpdate = async (payload: ReferralLinkInput) => {
    if (!editing) return;

    const result = await updateReferralLink(editing.id, payload);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setEditing(null);
    refresh();
  };

  const toggleStatus = async (referral: ReferralLinkRow) => {
    const nextStatus = referral.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const result = await updateReferralLinkStatus(referral.id, nextStatus);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    refresh();
  };

  const copyLink = async (referral: ReferralLinkRow) => {
    const href = getReferralHref(referral.slug);

    try {
      await navigator.clipboard.writeText(href);
      toast.success("Referral link copied.");
    } catch {
      toast.error(href);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;

    const result = await deleteReferralLink(deleting.id);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setDeleting(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#222] bg-[#111] p-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Label className="mb-1.5 block text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
            Referral Report Filter
          </Label>
          <Select
            value={reportFilter}
            onValueChange={(value) =>
              setReportFilter(value as ReferralReportFilter)
            }
          >
            <SelectTrigger className="w-full border-[#2a2a2a] bg-[#0d0d0d] text-white sm:w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-[#2a2a2a] bg-[#111] text-white">
              <SelectItem value="ALL">All referrals</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="DELETED">Deleted</SelectItem>
              <SelectItem value="HAS_APPLICATIONS">Has applications</SelectItem>
              <SelectItem value="HAS_LIVE_SITES">Has live sites</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-[#888]">
            Showing {filteredReferrals.length} of {referrals.length} referral
            links
          </p>
          <Button
            type="button"
            onClick={() => setCreating(true)}
            className="bg-cyan-500 text-black hover:bg-cyan-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Referral Link
          </Button>
        </div>
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onDeleteSelected={() => setShowBulkDeleteDialog(true)}
        isDeleting={isBulkDeleting}
        itemLabel="referral links"
      />

      {referrals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0a0a0a] px-6 py-12 text-center">
          <p className="text-sm font-medium text-white">
            No referral links yet.
          </p>
          <p className="mt-2 text-xs leading-6 text-[#666]">
            Create the first referral link to start tracking partner-driven
            school applications.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#222] bg-[#111]">
          <Table>
            <TableHeader>
              <TableRow className="border-[#222] bg-[#0d0d0d] hover:bg-[#0d0d0d]">
                <TableHead className="w-12 px-4">
                  <Checkbox
                    checked={
                      filteredReferrals.length > 0 &&
                      filteredReferrals.every((r) => selectedIds.includes(r.id))
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all referrals"
                  />
                </TableHead>
                <TableHead className="w-16 px-4 text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  SN
                </TableHead>
                <TableHead className="px-4 text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  Name/Organization
                </TableHead>
                <TableHead className="px-4 text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  Referral Link
                </TableHead>
                <TableHead className="px-4 text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  Status
                </TableHead>
                <TableHead className="px-4 text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  Performance
                </TableHead>
                <TableHead className="px-4 text-right text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReferrals.length === 0 ? (
                <TableRow className="border-[#222] bg-[#111]">
                  <TableCell
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-[#666]"
                  >
                    No referral links match this filter.
                  </TableCell>
                </TableRow>
              ) : null}
              {filteredReferrals.map((referral, index) => {
                const isSelected = selectedIds.includes(referral.id);

                return (
                  <TableRow
                    key={referral.id}
                    onClick={() => setViewing(referral)}
                    className={cn(
                      "cursor-pointer border-[#222] bg-[#111] text-white hover:bg-[#171717]",
                      isSelected && "bg-cyan-950/10",
                    )}
                  >
                    <TableCell
                      className="px-4 py-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectOne(referral.id)}
                        aria-label={`Select ${referral.displayName}`}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4 align-middle text-sm text-[#777]">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-4 align-middle">
                      <div className="min-w-0">
                        <p className="line-clamp-1 max-w-[220px] text-sm font-medium text-white">
                          {referral.displayName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 align-middle">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void copyLink(referral);
                        }}
                        className="max-w-[260px] truncate rounded-lg border border-[#222] bg-[#0d0d0d] px-3 py-2 text-left text-xs text-cyan-300 transition-colors hover:border-cyan-500/30"
                      >
                        /webrandschools/r/{referral.slug}
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-4 align-middle">
                      <div className="space-y-1">
                        <Badge className={statusClassName(referral)}>
                          {statusLabel(referral)}
                        </Badge>
                        {referral.expiresAt ? (
                          <p className="text-[11px] text-[#666]">
                            Expires {formatDate(referral.expiresAt)}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#666]">No expiry</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 align-middle">
                      <div className="space-y-1 text-sm text-[#aaa]">
                        <p>
                          {formatCount(referral.applicationCount)} applications
                        </p>
                        <p className="text-xs text-[#666]">
                          {formatCount(referral.liveSiteCount)} live
                        </p>
                      </div>
                    </TableCell>
                    <TableCell
                      className="px-4 py-4 align-middle"
                      onClick={(event) => event.stopPropagation()}
                    >
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
                              onClick={() => void copyLink(referral)}
                              className="cursor-pointer hover:bg-[#1a1a1a]"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setViewing(referral)}
                              className="cursor-pointer hover:bg-[#1a1a1a]"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEditing(referral)}
                              disabled={isDeleted(referral)}
                              className="cursor-pointer hover:bg-[#1a1a1a]"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit referral
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => void toggleStatus(referral)}
                              disabled={isDeleted(referral)}
                              className="cursor-pointer hover:bg-[#1a1a1a]"
                            >
                              {referral.status === "ACTIVE" ? (
                                <>
                                  <PowerOff className="mr-2 h-4 w-4 text-amber-400" />
                                  Deactivate link
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 h-4 w-4 text-emerald-400" />
                                  Activate link
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#222]" />
                            <DropdownMenuItem
                              onClick={() => setDeleting(referral)}
                              disabled={isDeleted(referral)}
                              className="cursor-pointer text-red-400 hover:bg-red-950/20 hover:text-red-300"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-[#222] bg-[#111] text-white sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create referral link</DialogTitle>
          </DialogHeader>
          <ReferralForm onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto border-[#222] bg-[#111] text-white sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit referral link</DialogTitle>
          </DialogHeader>
          <ReferralForm initialData={editing} onSubmit={handleUpdate} />
        </DialogContent>
      </Dialog>

      <ReferralDetailDialog
        referral={viewing}
        onClose={() => setViewing(null)}
        onCopy={(referral) => void copyLink(referral)}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent className="border-[#222] bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete referral link?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#777]">
              This removes the link from the admin list and prevents future
              attribution. Existing applications will keep their saved referral
              snapshots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2a2a2a] bg-transparent text-[#888] hover:bg-[#1a1a1a] hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              Delete referral link
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
              Delete {selectedIds.length} referral link
              {selectedIds.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#777]">
              This removes the {selectedIds.length} selected link
              {selectedIds.length === 1 ? "" : "s"} from the admin list and
              prevents future attribution. Existing applications will retain
              their saved referral snapshots.
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
              onClick={handleBulkDelete}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              {isBulkDeleting ? "Deleting..." : "Delete selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
