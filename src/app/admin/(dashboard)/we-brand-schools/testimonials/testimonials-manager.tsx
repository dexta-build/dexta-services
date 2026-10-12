"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Quote, Trash2, MoreHorizontal, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/events/image-upload";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_NAME_CHARACTERS,
  SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_POSITION_CHARACTERS,
  SCHOOL_WEBSITE_TESTIMONIAL_MAX_CHARACTERS,
  SCHOOL_WEBSITE_TESTIMONIAL_MAX_SCHOOL_NAME_CHARACTERS,
  schoolWebsiteTestimonialSchema,
  type SchoolWebsiteTestimonialInput,
} from "@/lib/validators";
import {
  createSchoolWebsiteTestimonial,
  deleteSchoolWebsiteTestimonial,
  deleteSchoolWebsiteTestimonials,
  updateSchoolWebsiteTestimonial,
  type SchoolWebsiteTestimonialRow,
} from "../actions";

function getSchoolInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function resolvePreviewSource(value: string) {
  if (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${value}`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

function TestimonialForm({
  initialData,
  onSubmit,
}: {
  initialData?: SchoolWebsiteTestimonialRow | null;
  onSubmit: (data: SchoolWebsiteTestimonialInput) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SchoolWebsiteTestimonialInput>({
    resolver: zodResolver(schoolWebsiteTestimonialSchema),
    defaultValues: {
      schoolName: initialData?.schoolName ?? "",
      logoPublicId: initialData?.logoPublicId ?? null,
      quote: initialData?.quote ?? "",
      authorName: initialData?.authorName ?? "",
      authorPosition: initialData?.authorPosition ?? "",
      isVisible: initialData?.isVisible ?? true,
      position: initialData?.position ?? 0,
    },
  });

  useEffect(() => {
    reset({
      schoolName: initialData?.schoolName ?? "",
      logoPublicId: initialData?.logoPublicId ?? null,
      quote: initialData?.quote ?? "",
      authorName: initialData?.authorName ?? "",
      authorPosition: initialData?.authorPosition ?? "",
      isVisible: initialData?.isVisible ?? true,
      position: initialData?.position ?? 0,
    });
  }, [initialData, reset]);

  const quoteValue = watch("quote") ?? "";
  const schoolNameValue = watch("schoolName") ?? "";
  const authorNameValue = watch("authorName") ?? "";
  const authorPositionValue = watch("authorPosition") ?? "";
  return (
    <form
      onSubmit={handleSubmit(async (data) => onSubmit(data))}
      className="max-h-[78vh] space-y-4 overflow-y-auto pr-1"
    >
      <input type="hidden" {...register("logoPublicId")} />

      <div>
        <Label className="mb-1.5 block text-xs text-[#888]">School logo</Label>
        <ImageUpload
          value={watch("logoPublicId") ?? undefined}
          onChange={(value) =>
            setValue("logoPublicId", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          onRemove={() =>
            setValue("logoPublicId", null, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          emptyLabel="Upload school logo"
          previewAlt={watch("schoolName") || "School logo"}
        />
        <p className="mt-2 text-xs text-[#555]">
          Upload the school logo used on the left side of the public testimonial
          card.
        </p>
        <FieldError message={errors.logoPublicId?.message} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs text-[#888]">
            School name
            <span className="ml-2 text-[11px] text-[#666]">
              Max {SCHOOL_WEBSITE_TESTIMONIAL_MAX_SCHOOL_NAME_CHARACTERS}{" "}
              characters
            </span>
          </Label>
          <Input
            maxLength={SCHOOL_WEBSITE_TESTIMONIAL_MAX_SCHOOL_NAME_CHARACTERS}
            className="border-[#2a2a2a] bg-[#0d0d0d] text-white"
            {...register("schoolName")}
          />
          <p className="mt-1 text-[11px] text-[#777]">
            {schoolNameValue.trim().length}/
            {SCHOOL_WEBSITE_TESTIMONIAL_MAX_SCHOOL_NAME_CHARACTERS} characters
          </p>
          <FieldError message={errors.schoolName?.message} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-[#888]">
            Display order
          </Label>
          <Input
            type="number"
            min={0}
            className="border-[#2a2a2a] bg-[#0d0d0d] text-white"
            {...register("position", { valueAsNumber: true })}
          />
          <FieldError message={errors.position?.message} />
        </div>
      </div>

      <div>
        <Label className="mb-1.5 block text-xs text-[#888]">
          Write-up
          <span className="ml-2 text-[11px] text-[#666]">
            Max {SCHOOL_WEBSITE_TESTIMONIAL_MAX_CHARACTERS} characters
          </span>
        </Label>
        <Textarea
          rows={6}
          className="border-[#2a2a2a] bg-[#0d0d0d] text-white"
          maxLength={SCHOOL_WEBSITE_TESTIMONIAL_MAX_CHARACTERS}
          {...register("quote")}
        />
        <p className="mt-2 text-xs text-[#666]">
          Limit the testimonial to {SCHOOL_WEBSITE_TESTIMONIAL_MAX_CHARACTERS}{" "}
          characters so all lines remain visible on the public card.
        </p>
        <p className="mt-1 text-[11px] text-[#777]">
          {quoteValue.trim().length}/{SCHOOL_WEBSITE_TESTIMONIAL_MAX_CHARACTERS}{" "}
          characters
        </p>
        <FieldError message={errors.quote?.message} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs text-[#888]">
            Contact name
            <span className="ml-2 text-[11px] text-[#666]">
              Max {SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_NAME_CHARACTERS}{" "}
              characters
            </span>
          </Label>
          <Input
            maxLength={SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_NAME_CHARACTERS}
            className="border-[#2a2a2a] bg-[#0d0d0d] text-white"
            {...register("authorName")}
          />
          <p className="mt-1 text-[11px] text-[#777]">
            {authorNameValue.trim().length}/
            {SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_NAME_CHARACTERS} characters
          </p>
          <FieldError message={errors.authorName?.message} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-[#888]">
            Position in school
            <span className="ml-2 text-[11px] text-[#666]">
              Max {SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_POSITION_CHARACTERS}{" "}
              characters
            </span>
          </Label>
          <Input
            maxLength={
              SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_POSITION_CHARACTERS
            }
            className="border-[#2a2a2a] bg-[#0d0d0d] text-white"
            {...register("authorPosition")}
          />
          <p className="mt-1 text-[11px] text-[#777]">
            {authorPositionValue.trim().length}/
            {SCHOOL_WEBSITE_TESTIMONIAL_MAX_AUTHOR_POSITION_CHARACTERS}{" "}
            characters
          </p>
          <FieldError message={errors.authorPosition?.message} />
        </div>
      </div>

      <label className="flex items-center justify-between rounded-xl border border-[#222] bg-[#0d0d0d] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">Visible on page</p>
          <p className="text-xs text-[#666]">
            Hide this testimonial without deleting the card.
          </p>
        </div>
        <Switch
          checked={watch("isVisible")}
          onCheckedChange={(checked) =>
            setValue("isVisible", checked, {
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
          {isSubmitting ? "Saving..." : "Save testimonial"}
        </Button>
      </div>
    </form>
  );
}

export function TestimonialsManager({
  testimonials,
}: {
  testimonials: SchoolWebsiteTestimonialRow[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SchoolWebsiteTestimonialRow | null>(
    null,
  );
  const [deleting, setDeleting] = useState<SchoolWebsiteTestimonialRow | null>(
    null,
  );
  const [viewing, setViewing] = useState<SchoolWebsiteTestimonialRow | null>(
    null,
  );

  const refresh = () => router.refresh();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const toggleSelectAll = () => {
    const allIds = testimonials.map((t) => t.id);
    const allSelected = allIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
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
    const result = await deleteSchoolWebsiteTestimonials(selectedIds);
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

  const handleCreate = async (payload: SchoolWebsiteTestimonialInput) => {
    const result = await createSchoolWebsiteTestimonial(payload);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setCreating(false);
    refresh();
  };

  const handleUpdate = async (payload: SchoolWebsiteTestimonialInput) => {
    if (!editing) return;

    const result = await updateSchoolWebsiteTestimonial(editing.id, payload);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setEditing(null);
    refresh();
  };

  const handleDelete = async () => {
    if (!deleting) return;

    const result = await deleteSchoolWebsiteTestimonial(deleting.id);
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
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => setCreating(true)}
          className="bg-cyan-500 text-black hover:bg-cyan-400"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Testimonial
        </Button>
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onDeleteSelected={() => setShowBulkDeleteDialog(true)}
        isDeleting={isBulkDeleting}
        itemLabel="testimonials"
      />

      {testimonials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0a0a0a] px-6 py-12 text-center">
          <p className="text-sm font-medium text-white">
            No school testimonial cards yet.
          </p>
          <p className="mt-2 text-xs leading-6 text-[#666]">
            Add the first school logo, write-up, and contact details to populate
            the public testimonial carousel.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#222] bg-[#111]">
          <Table>
            <TableHeader>
              <TableRow className="border-[#222] bg-[#0d0d0d] hover:bg-[#0d0d0d]">
                <TableHead className="w-12 px-3">
                  <Checkbox
                    checked={
                      testimonials.length > 0 &&
                      testimonials.every((t) => selectedIds.includes(t.id))
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all testimonials"
                  />
                </TableHead>
                <TableHead className="w-[88px] px-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#777]">
                  Logo
                </TableHead>
                <TableHead className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#777]">
                  School
                </TableHead>
                <TableHead className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#777]">
                  Contact
                </TableHead>
                <TableHead className="w-[120px] px-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#777]">
                  Status
                </TableHead>
                <TableHead className="w-[80px] px-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#777]">
                  Order
                </TableHead>
                <TableHead className="w-[100px] px-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-[#777]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((testimonial) => {
                const initials = getSchoolInitials(testimonial.schoolName);
                const isSelected = selectedIds.includes(testimonial.id);

                return (
                  <TableRow
                    key={testimonial.id}
                    className={cn(
                      "cursor-pointer border-[#222] bg-[#111] text-white hover:bg-[#171717]",
                      isSelected && "bg-cyan-950/10",
                    )}
                    onClick={() => setViewing(testimonial)}
                  >
                    <TableCell
                      className="px-3 py-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectOne(testimonial.id)}
                        aria-label={`Select ${testimonial.schoolName}`}
                      />
                    </TableCell>
                    <TableCell className="px-3 py-4 whitespace-normal">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#222] bg-[#0d0d0d]">
                        {testimonial.logoPublicId ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolvePreviewSource(testimonial.logoPublicId)}
                            alt={`${testimonial.schoolName} logo`}
                            className="max-h-10 w-auto max-w-[90%] object-contain"
                          />
                        ) : (
                          <span className="text-sm font-semibold tracking-[0.18em] text-white">
                            {initials || "SC"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-4 align-middle whitespace-normal">
                      <div className="min-w-0">
                        <p className="line-clamp-2 max-w-[220px] text-sm font-medium leading-5 text-white">
                          {testimonial.schoolName}
                        </p>
                        <p className="mt-1 line-clamp-1 max-w-[220px] text-xs text-[#777]">
                          “{testimonial.quote}”
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-4 align-middle whitespace-normal">
                      <div className="min-w-0">
                        <p className="line-clamp-2 max-w-[180px] text-sm font-medium leading-5 text-white">
                          {testimonial.authorName}
                        </p>
                        <p className="mt-1 line-clamp-2 max-w-[180px] text-xs uppercase tracking-[0.14em] text-[#777]">
                          {testimonial.authorPosition}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-4 align-middle whitespace-normal">
                      <span
                        className={
                          testimonial.isVisible
                            ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300"
                            : "rounded-full border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]"
                        }
                      >
                        {testimonial.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-[#bbb] whitespace-normal">
                      {testimonial.position}
                    </TableCell>
                    <TableCell
                      className="px-3 py-4 whitespace-normal"
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
                            className="w-44 border-[#222] bg-[#111] text-white"
                          >
                            <DropdownMenuItem
                              onClick={() => setViewing(testimonial)}
                              className="cursor-pointer hover:bg-[#1a1a1a]"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEditing(testimonial)}
                              className="cursor-pointer hover:bg-[#1a1a1a]"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit card
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#222]" />
                            <DropdownMenuItem
                              onClick={() => setDeleting(testimonial)}
                              className="cursor-pointer text-red-400 hover:bg-red-950/20 hover:text-red-300"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete card
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

      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) {
            setViewing(null);
          }
        }}
      >
        <DialogContent className="border-[#222] bg-[#111] text-white sm:max-w-2xl">
          {viewing ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Quote className="h-5 w-5 text-cyan-400" />
                  Testimonial Details
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-[140px_minmax(0,1fr)]">
                  <div className="flex h-32 items-center justify-center overflow-hidden rounded-3xl border border-[#222] bg-[#0d0d0d] p-4">
                    {viewing.logoPublicId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolvePreviewSource(viewing.logoPublicId)}
                        alt={`${viewing.schoolName} logo`}
                        className="max-h-full w-auto max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-3xl font-semibold tracking-[0.18em] text-white">
                        {getSchoolInitials(viewing.schoolName) || "SC"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">
                        School
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {viewing.schoolName}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#777]">
                          Contact
                        </p>
                        <p className="mt-2 text-sm text-white">
                          {viewing.authorName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#777]">
                          Position
                        </p>
                        <p className="mt-2 text-sm text-white">
                          {viewing.authorPosition}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#777]">
                          Display Order
                        </p>
                        <p className="mt-2 text-sm text-white">
                          {viewing.position}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#777]">
                    Full Write-up
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#d8d8d8]">
                    “{viewing.quote}”
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={
                      viewing.isVisible
                        ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300"
                        : "rounded-full border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]"
                    }
                  >
                    {viewing.isVisible ? "Visible on page" : "Hidden from page"}
                  </span>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditing(viewing);
                        setViewing(null);
                      }}
                      className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setViewing(null)}
                      className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={creating} onOpenChange={setCreating} modal={false}>
        <DialogContent
          className="border-[#222] bg-[#111] text-white sm:max-w-2xl"
          onInteractOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-cyan-400" />
              Add Testimonial
            </DialogTitle>
          </DialogHeader>
          <TestimonialForm onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        modal={false}
      >
        <DialogContent
          className="border-[#222] bg-[#111] text-white sm:max-w-2xl"
          onInteractOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-cyan-400" />
              Edit Testimonial
            </DialogTitle>
          </DialogHeader>
          <TestimonialForm initialData={editing} onSubmit={handleUpdate} />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
      >
        <AlertDialogContent className="border-[#222] bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete testimonial card?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#888]">
              This will remove the testimonial card for{" "}
              <span className="font-semibold text-white">
                {deleting?.schoolName}
              </span>{" "}
              from the admin list and the public page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              Delete card
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
              Delete {selectedIds.length} testimonial
              {selectedIds.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#888]">
              This will permanently remove the {selectedIds.length} selected
              testimonial card{selectedIds.length === 1 ? "" : "s"} from the
              admin list and the public website carousel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isBulkDeleting}
              className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]"
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
