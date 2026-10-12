"use client";

import { Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionsBarProps {
  selectedCount: number;
  onClear?: () => void;
  onClearSelection?: () => void;
  onDelete?: () => void;
  onDeleteSelected?: () => void;
  isDeleting?: boolean;
  itemLabel?: string;
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  onClearSelection,
  onDelete,
  onDeleteSelected,
  isDeleting = false,
  itemLabel = "item",
}: BulkActionsBarProps) {
  const handleClear = onClearSelection ?? onClear;
  const handleDelete = onDeleteSelected ?? onDelete ?? (() => {});
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm animate-in fade-in-50 slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {selectedCount}
        </span>
        <span className="font-medium text-white">
          {selectedCount} {itemLabel}
          {selectedCount > 1 ? "s" : ""} selected
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={isDeleting}
          className="h-7 text-xs text-[#888] hover:bg-white/10 hover:text-white"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Clear selection
        </Button>
      </div>

      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={handleDelete}
        disabled={isDeleting}
        className="h-8 bg-red-600 text-white hover:bg-red-700"
      >
        {isDeleting ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        )}
        Delete Selected ({selectedCount})
      </Button>
    </div>
  );
}
