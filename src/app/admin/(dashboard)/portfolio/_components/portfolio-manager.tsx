"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Star,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  Play,
  Image as ImageIcon,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BulkActionsBar } from "@/components/admin/bulk-actions-bar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { getCloudinaryUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { PortfolioItemRow, ServiceType } from "../actions";
import {
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  deletePortfolioItems,
  toggleFeatured,
  toggleVisibility,
  reorderPortfolioItems,
} from "../actions";
import { PortfolioItemForm } from "./portfolio-item-form";
import type { PortfolioItemInput } from "@/lib/validators";

// ─── Thumbnail helpers ────────────────────────────────────────────────────────

function getThumbnailSrc(item: PortfolioItemRow): string | null {
  const coverAsset =
    item.assets.find((asset) => asset.id === item.coverAssetId) ??
    item.assets[0];

  if (coverAsset) {
    if (coverAsset.mediaType === "VIDEO") {
      if (coverAsset.thumbnailPublicId) {
        return getCloudinaryUrl(coverAsset.thumbnailPublicId, {
          w: 160,
          h: 100,
          c: "fill",
          f: "auto",
          q: "auto",
        });
      }

      return null;
    }

    return getCloudinaryUrl(coverAsset.publicId, {
      w: 160,
      h: 100,
      c: "fill",
      f: "auto",
      q: "auto",
    });
  }

  if (item.mediaType === "VIDEO") {
    if (item.thumbnailPublicId) {
      return getCloudinaryUrl(item.thumbnailPublicId, {
        w: 160,
        h: 100,
        c: "fill",
        f: "auto",
        q: "auto",
      });
    }
    return null;
  }
  return getCloudinaryUrl(item.mediaPublicId, {
    w: 160,
    h: 100,
    c: "fill",
    f: "auto",
    q: "auto",
  });
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { type: ServiceType; label: string; accent: string }[] = [
  {
    type: "DESIGN",
    label: "Design",
    accent: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  },
  {
    type: "BUILD",
    label: "Build",
    accent: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
  },
  {
    type: "PRINT",
    label: "Print",
    accent: "text-pink-400 border-pink-500/40 bg-pink-500/10",
  },
];

// ─── Portfolio Manager ────────────────────────────────────────────────────────

interface PortfolioManagerProps {
  items: PortfolioItemRow[];
  featuredCounts: Record<ServiceType, number>;
  activeTab: ServiceType;
}

export function PortfolioManager({
  items: initialItems,
  featuredCounts: initialCounts,
  activeTab: initialTab,
}: PortfolioManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ServiceType>(initialTab);
  const [items, setItems] = useState(initialItems);
  const [featuredCounts, setFeaturedCounts] = useState(initialCounts);
  const [editingItem, setEditingItem] = useState<PortfolioItemRow | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  useEffect(() => {
    setFeaturedCounts(initialCounts);
  }, [initialCounts]);

  const tabItems = items.filter((i) => i.serviceType === activeTab);

  const toggleSelectAll = () => {
    const currentTabIds = tabItems.map((item) => item.id);
    const allSelected = currentTabIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !currentTabIds.includes(id)),
      );
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...currentTabIds])),
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
    const result = await deletePortfolioItems(selectedIds);
    setIsBulkDeleting(false);

    if (result.success) {
      toast.success(result.message);
      setItems((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
      setSelectedIds([]);
      setShowBulkDeleteDialog(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleTabChange = (type: ServiceType) => {
    setActiveTab(type);
    router.push(`/admin/portfolio?tab=${type.toLowerCase()}`, {
      scroll: false,
    });
  };

  // ── Reorder ──────────────────────────────────────────────────────────────────
  const moveItem = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tabItems.length) return;

    const reordered = [...tabItems];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];

    const updated = items.map((item) => {
      const found = reordered.find((r) => r.id === item.id);
      return found ?? item;
    });
    setItems(updated);
    setReordering(true);

    const result = await reorderPortfolioItems(reordered.map((i) => i.id));
    setReordering(false);
    if (!result.success) {
      toast.error(result.message);
      setItems(initialItems);
    }
  };

  // ── Toggle Featured ──────────────────────────────────────────────────────────
  const handleToggleFeatured = async (item: PortfolioItemRow) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, isFeatured: !i.isFeatured } : i,
      ),
    );
    setFeaturedCounts((prev) => ({
      ...prev,
      [item.serviceType]: prev[item.serviceType] + (item.isFeatured ? -1 : 1),
    }));

    const result = await toggleFeatured(item.id, item.isFeatured);
    if (!result.success) {
      toast.error(result.message);
      setItems(initialItems);
      setFeaturedCounts(initialCounts);
    } else {
      toast.success(result.message);
    }
  };

  // ── Toggle Visibility ────────────────────────────────────────────────────────
  const handleToggleVisibility = async (item: PortfolioItemRow) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, isVisible: !i.isVisible } : i,
      ),
    );

    const result = await toggleVisibility(item.id, item.isVisible);
    if (!result.success) {
      toast.error(result.message);
      setItems(initialItems);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingId) return;
    const item = items.find((i) => i.id === deletingId);
    const result = await deletePortfolioItem(deletingId);
    if (result.success) {
      setItems((prev) => prev.filter((i) => i.id !== deletingId));
      if (item?.isFeatured) {
        setFeaturedCounts((prev) => ({
          ...prev,
          [item.serviceType]: Math.max(0, prev[item.serviceType] - 1),
        }));
      }
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setDeletingId(null);
  };

  // ── Create ───────────────────────────────────────────────────────────────────
  const handleCreate = async (data: PortfolioItemInput) => {
    const result = await createPortfolioItem(data);
    if (result.success) {
      toast.success(result.message);
      setIsAddOpen(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const handleEdit = async (data: PortfolioItemInput) => {
    if (!editingItem) return;
    const result = await updatePortfolioItem(editingItem.id, data);
    if (result.success) {
      toast.success(result.message);
      setEditingItem(null);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            onClick={() => handleTabChange(tab.type)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors",
              activeTab === tab.type
                ? tab.accent
                : "border-[#222] bg-[#0d0d0d] text-[#666] hover:border-[#333] hover:text-white",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                featuredCounts[tab.type] > 0
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-[#1a1a1a] text-[#555]",
              )}
            >
              {featuredCounts[tab.type]} featured
            </span>
          </button>
        ))}
      </div>

      {/* ── Bulk Actions Bar ─────────────────────────────────────────────────── */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onDeleteSelected={() => setShowBulkDeleteDialog(true)}
        isDeleting={isBulkDeleting}
        itemLabel="portfolio items"
      />

      {/* ── Grid ─────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#222] bg-[#111]">
        {tabItems.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[#555]">
              No {activeTab.toLowerCase()} items yet. Add one below.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between border-b border-[#222] bg-[#0d0d0d] px-4 py-2.5">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={
                    tabItems.length > 0 &&
                    tabItems.every((item) => selectedIds.includes(item.id))
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all items in this tab"
                />
                <span className="text-xs font-semibold tracking-[0.16em] text-[#777] uppercase">
                  Select All ({tabItems.length})
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#1a1a1a]">
              {tabItems.map((item, index) => {
                const thumbSrc = getThumbnailSrc(item);
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-colors sm:gap-4",
                      isSelected ? "bg-cyan-950/10" : "hover:bg-[#141414]",
                    )}
                  >
                    {/* Selection Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectOne(item.id)}
                      aria-label={`Select ${item.title}`}
                    />

                    {/* Thumbnail */}
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-[#0d0d0d] border border-[#2a2a2a]">
                      {thumbSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbSrc}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-[#444]" />
                        </div>
                      )}
                      {item.mediaType === "VIDEO" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Play className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-[#555] uppercase">
                          {item.mediaType}
                        </span>
                        {item.isFeatured && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                            <Star className="h-2.5 w-2.5 fill-amber-400" />
                            Featured
                          </span>
                        )}
                        {item.serviceType === "BUILD" && item.websiteUrl ? (
                          <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                            <ArrowUpRight className="h-2.5 w-2.5" />
                            Link added
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Reorder arrows */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0 || reordering}
                        onClick={() => moveItem(index, "up")}
                        className="rounded p-0.5 text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === tabItems.length - 1 || reordering}
                        onClick={() => moveItem(index, "down")}
                        className="rounded p-0.5 text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Actions Dropdown */}
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
                          onClick={() => setEditingItem(item)}
                          className="cursor-pointer hover:bg-[#1a1a1a]"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit item
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleFeatured(item)}
                          className="cursor-pointer hover:bg-[#1a1a1a]"
                        >
                          <Star
                            className={cn(
                              "mr-2 h-4 w-4",
                              item.isFeatured &&
                                "fill-amber-400 text-amber-400",
                            )}
                          />
                          {item.isFeatured
                            ? "Remove from featured"
                            : "Mark as featured"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleVisibility(item)}
                          className="cursor-pointer hover:bg-[#1a1a1a]"
                        >
                          {item.isVisible ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Hide from site
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Show on site
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#222]" />
                        <DropdownMenuItem
                          onClick={() => setDeletingId(item.id)}
                          className="cursor-pointer text-red-400 hover:bg-red-950/20 hover:text-red-300"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete item
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Add button ───────────────────────────────────────────────────────── */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsAddOpen(true)}
        className="border-[#2a2a2a] text-[#888] hover:bg-[#1a1a1a] hover:text-white"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add Item
      </Button>

      {/* ── Add dialog ───────────────────────────────────────────────────────── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen} modal={false}>
        <DialogContent
          className="border-[#222] bg-[#111] text-white sm:max-w-lg"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Add Portfolio Item</DialogTitle>
          </DialogHeader>
          <PortfolioItemForm
            defaultServiceType={activeTab}
            onSubmit={handleCreate}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ──────────────────────────────────────────────────────── */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        modal={false}
      >
        <DialogContent
          className="border-[#222] bg-[#111] text-white sm:max-w-lg"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              Edit Portfolio Item
            </DialogTitle>
          </DialogHeader>
          {editingItem && (
            <PortfolioItemForm
              initialData={editingItem}
              defaultServiceType={activeTab}
              onSubmit={handleEdit}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ───────────────────────────────────────────────── */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent className="border-[#222] bg-[#111]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete this item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#666]">
              This will permanently remove the item and delete its media from
              Cloudinary. This action cannot be undone.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete confirmation ───────────────────────────────────────────── */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent className="border-[#222] bg-[#111]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete {selectedIds.length} selected portfolio item
              {selectedIds.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#666]">
              This will permanently delete the selected portfolio items and
              remove their media assets. This action cannot be undone.
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
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {isBulkDeleting ? "Deleting..." : "Delete All Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
