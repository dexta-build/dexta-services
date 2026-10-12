"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Eye,
  Link as LinkIcon,
  Pencil,
  Plus,
  Trash2,
  Video,
  MoreHorizontal,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SchoolWebsiteTemplateInput } from "@/lib/validators";
import {
  createSchoolWebsiteTemplate,
  deleteSchoolWebsiteTemplate,
  deleteSchoolWebsiteTemplates,
  updateSchoolWebsiteTemplate,
  type SchoolWebsiteTemplateRow,
} from "../actions";
import { TemplateForm } from "./template-form";

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

function templateStatusClassName(isVisible: boolean) {
  return isVisible
    ? "border-green-500/20 bg-green-500/10 text-green-400"
    : "border-[#2a2a2a] bg-[#0d0d0d] text-[#888]";
}

function getCoverAsset(template: SchoolWebsiteTemplateRow) {
  return (
    template.assets.find((asset) => asset.id === template.coverAssetId) ??
    template.assets[0] ??
    null
  );
}

function TemplateAssetPreview({
  templateName,
  publicId,
  mediaType,
}: {
  templateName: string;
  publicId: string;
  mediaType: "IMAGE" | "VIDEO";
}) {
  if (mediaType === "IMAGE") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvePreviewSource(publicId)}
        alt={templateName}
        className="h-full w-full bg-white object-contain"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0f0f0f] text-[#888]">
      <Video className="h-5 w-5" />
      <span className="text-xs font-medium uppercase tracking-[0.2em]">
        Video Asset
      </span>
    </div>
  );
}

export function TemplatesManager({
  templates,
}: {
  templates: SchoolWebsiteTemplateRow[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<SchoolWebsiteTemplateRow | null>(null);
  const [editing, setEditing] = useState<SchoolWebsiteTemplateRow | null>(null);
  const [deleting, setDeleting] = useState<SchoolWebsiteTemplateRow | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const refresh = () => router.refresh();

  const toggleSelectAll = () => {
    const allIds = templates.map((t) => t.id);
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
    const result = await deleteSchoolWebsiteTemplates(selectedIds);
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

  const handleCreate = async (payload: SchoolWebsiteTemplateInput) => {
    const result = await createSchoolWebsiteTemplate(payload);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setCreating(false);
    refresh();
  };

  const handleUpdate = async (payload: SchoolWebsiteTemplateInput) => {
    if (!editing) return;

    const result = await updateSchoolWebsiteTemplate(editing.id, payload);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setEditing(null);
    refresh();
  };

  const openEditing = (template: SchoolWebsiteTemplateRow) => {
    setViewing(null);
    setEditing(template);
  };

  const handleDelete = async () => {
    if (!deleting) return;

    const result = await deleteSchoolWebsiteTemplate(deleting.id);
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
          Add Template
        </Button>
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onDeleteSelected={() => setShowBulkDeleteDialog(true)}
        isDeleting={isBulkDeleting}
        itemLabel="templates"
      />

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0a0a0a] px-6 py-12 text-center">
          <p className="text-sm font-medium text-white">
            No templates in the database yet.
          </p>
          <p className="mt-2 text-xs leading-6 text-[#666]">
            Add the first school template so it can appear on the public We
            Brand Schools page.
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
                      templates.length > 0 &&
                      templates.every((t) => selectedIds.includes(t.id))
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all templates"
                  />
                </TableHead>
                <TableHead className="px-4 text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  Template
                </TableHead>
                <TableHead className="px-4 text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  Status
                </TableHead>
                <TableHead className="px-4 text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  Position
                </TableHead>
                <TableHead className="px-4 text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  Assets
                </TableHead>
                <TableHead className="px-4 text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  Highlights
                </TableHead>
                <TableHead className="px-4 text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  Live URL
                </TableHead>
                <TableHead className="px-4 text-right text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => {
                const coverAsset = getCoverAsset(template);
                const isSelected = selectedIds.includes(template.id);

                return (
                  <TableRow
                    key={template.id}
                    tabIndex={0}
                    onClick={() => setViewing(template)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setViewing(template);
                      }
                    }}
                    className={cn(
                      "cursor-pointer border-[#222] bg-[#111] text-[#d5d5d5] hover:bg-[#171717] focus-visible:bg-[#171717] focus-visible:outline-none",
                      isSelected && "bg-cyan-950/10",
                    )}
                  >
                    <TableCell
                      className="px-4 py-3 align-top"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectOne(template.id)}
                        aria-label={`Select ${template.name}`}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 align-top whitespace-normal">
                      <div className="flex min-w-[220px] items-start gap-3">
                        <div className="h-14 w-20 overflow-hidden rounded-xl border border-[#222] bg-[#0b0b0b]">
                          {coverAsset ? (
                            <TemplateAssetPreview
                              templateName={template.name}
                              publicId={coverAsset.publicId}
                              mediaType={coverAsset.mediaType}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-[#666]">
                              No media
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-white">
                              {template.name}
                            </p>
                            <span className="rounded-full border border-[#2a2a2a] bg-[#0d0d0d] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#777]">
                              View details
                            </span>
                          </div>
                          <p className="text-xs text-[#666]">
                            /{template.slug}
                          </p>
                          <p className="max-w-md text-xs leading-6 text-[#8d8d8d]">
                            {template.summary}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 align-top">
                      <Badge
                        variant="outline"
                        className={templateStatusClassName(template.isVisible)}
                      >
                        {template.isVisible ? "Visible" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 align-top text-sm text-[#b3b3b3]">
                      {template.position}
                    </TableCell>
                    <TableCell className="px-4 py-3 align-top text-sm text-[#b3b3b3]">
                      {template.assets.length}
                    </TableCell>
                    <TableCell className="px-4 py-3 align-top text-sm text-[#b3b3b3]">
                      {template.highlights.length}
                    </TableCell>
                    <TableCell className="px-4 py-3 align-top whitespace-normal">
                      {template.websiteUrl ? (
                        <a
                          href={template.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex max-w-[220px] items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {template.websiteUrl}
                          </span>
                        </a>
                      ) : (
                        <span className="text-xs text-[#666]">Not set</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 text-right align-top"
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
                              onClick={() => setViewing(template)}
                              className="cursor-pointer hover:bg-[#1a1a1a]"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditing(template)}
                              className="cursor-pointer hover:bg-[#1a1a1a]"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit template
                            </DropdownMenuItem>
                            {template.websiteUrl ? (
                              <DropdownMenuItem asChild>
                                <a
                                  href={template.websiteUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="cursor-pointer hover:bg-[#1a1a1a]"
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Open live URL
                                </a>
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator className="bg-[#222]" />
                            <DropdownMenuItem
                              onClick={() => setDeleting(template)}
                              className="cursor-pointer text-red-400 hover:bg-red-950/20 hover:text-red-300"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete template
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
        onOpenChange={(open) => !open && setViewing(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto border-[#222] bg-[#111] text-white sm:max-w-5xl">
          {viewing ? (
            <>
              <DialogHeader className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <DialogTitle className="text-white">
                        {viewing.name}
                      </DialogTitle>
                      <Badge
                        variant="outline"
                        className={templateStatusClassName(viewing.isVisible)}
                      >
                        {viewing.isVisible ? "Visible" : "Hidden"}
                      </Badge>
                    </div>
                    <DialogDescription className="text-[#8d8d8d]">
                      /{viewing.slug}
                    </DialogDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {viewing.websiteUrl ? (
                      <a
                        href={viewing.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          className="border-[#2a2a2a] text-[#d5d5d5] hover:bg-[#1a1a1a] hover:text-white"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open live URL
                        </Button>
                      </a>
                    ) : null}
                    <Button
                      type="button"
                      onClick={() => openEditing(viewing)}
                      className="bg-cyan-500 text-black hover:bg-cyan-400"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit template
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <div className="space-y-6">
                  <section className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-5">
                    <p className="text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                      Summary
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[#d5d5d5]">
                      {viewing.summary}
                    </p>
                    <div className="mt-5 border-t border-[#222] pt-5">
                      <p className="text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                        Description
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[#a7a7a7]">
                        {viewing.description?.trim() ||
                          "No extended description added yet."}
                      </p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                          Preview Assets
                        </p>
                        <p className="mt-1 text-xs text-[#666]">
                          All media attached to this template.
                        </p>
                      </div>
                      <span className="rounded-full border border-[#2a2a2a] px-3 py-1 text-xs text-[#9a9a9a]">
                        {viewing.assets.length} asset
                        {viewing.assets.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {viewing.assets.length ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {viewing.assets.map((asset, index) => (
                          <article
                            key={asset.id}
                            className="overflow-hidden rounded-2xl border border-[#222] bg-[#111]"
                          >
                            <div className="h-48 w-full overflow-hidden bg-[#0a0a0a]">
                              <TemplateAssetPreview
                                templateName={viewing.name}
                                publicId={asset.publicId}
                                mediaType={asset.mediaType}
                              />
                            </div>
                            <div className="space-y-3 p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[#2a2a2a] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#8d8d8d]">
                                  Asset {index + 1}
                                </span>
                                <span className="rounded-full border border-[#2a2a2a] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#8d8d8d]">
                                  {asset.mediaType}
                                </span>
                                {asset.id === viewing.coverAssetId ? (
                                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-300">
                                    Cover
                                  </span>
                                ) : null}
                              </div>
                              <div className="space-y-2 text-xs text-[#888]">
                                <p className="break-all">
                                  <span className="text-[#666]">
                                    Public ID:
                                  </span>{" "}
                                  {asset.publicId}
                                </p>
                                {asset.thumbnailPublicId ? (
                                  <p className="break-all">
                                    <span className="text-[#666]">
                                      Thumbnail:
                                    </span>{" "}
                                    {asset.thumbnailPublicId}
                                  </p>
                                ) : null}
                                <p>
                                  <span className="text-[#666]">Caption:</span>{" "}
                                  {asset.caption?.trim() || "No caption"}
                                </p>
                                <p>
                                  <span className="text-[#666]">Position:</span>{" "}
                                  {asset.position}
                                </p>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-[#2a2a2a] px-4 py-8 text-center text-sm text-[#666]">
                        No preview assets added yet.
                      </div>
                    )}
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-5">
                    <p className="text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                      Template Details
                    </p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-[#222] bg-[#111] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#666]">
                          Slug
                        </p>
                        <p className="mt-1 text-sm text-white">
                          /{viewing.slug}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#222] bg-[#111] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#666]">
                          Position
                        </p>
                        <p className="mt-1 text-sm text-white">
                          {viewing.position}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#222] bg-[#111] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#666]">
                          Visibility
                        </p>
                        <p className="mt-1 text-sm text-white">
                          {viewing.isVisible
                            ? "Visible on public page"
                            : "Hidden from public page"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#222] bg-[#111] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#666]">
                          Live URL
                        </p>
                        {viewing.websiteUrl ? (
                          <a
                            href={viewing.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-2 break-all text-sm text-cyan-400 hover:text-cyan-300"
                          >
                            <LinkIcon className="h-4 w-4 shrink-0" />
                            {viewing.websiteUrl}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-[#888]">Not set</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold tracking-[0.2em] text-[#777] uppercase">
                        Highlights
                      </p>
                      <span className="rounded-full border border-[#2a2a2a] px-3 py-1 text-xs text-[#9a9a9a]">
                        {viewing.highlights.length}
                      </span>
                    </div>
                    {viewing.highlights.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {viewing.highlights.map((highlight) => (
                          <span
                            key={highlight}
                            className="rounded-full border border-[#2a2a2a] bg-[#111] px-3 py-1.5 text-xs text-[#d5d5d5]"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-[#666]">
                        No highlights added yet.
                      </p>
                    )}
                  </section>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={creating} onOpenChange={setCreating} modal={false}>
        <DialogContent
          className="max-h-[92vh] overflow-y-auto border-[#222] bg-[#111] text-white sm:max-w-4xl"
          onInteractOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-white">New Template</DialogTitle>
          </DialogHeader>
          <TemplateForm
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        modal={false}
      >
        <DialogContent
          className="max-h-[92vh] overflow-y-auto border-[#222] bg-[#111] text-white sm:max-w-4xl"
          onInteractOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Edit Template</DialogTitle>
          </DialogHeader>
          {editing ? (
            <TemplateForm
              initialData={editing}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent className="border-[#222] bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete "{deleting?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#666]">
              This removes the template, all its preview assets, and any future
              admin edits tied to it. Existing applications will still keep
              their captured template name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2a2a2a] bg-transparent text-[#888] hover:bg-[#1a1a1a] hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              Delete Template
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
            <AlertDialogTitle className="text-white">
              Delete {selectedIds.length} template
              {selectedIds.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#666]">
              This will permanently delete the selected {selectedIds.length}{" "}
              template{selectedIds.length === 1 ? "" : "s"} and all associated
              preview assets. This action cannot be undone.
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
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {isBulkDeleting ? "Deleting..." : "Delete selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
