"use client";

import { Reorder, useDragControls } from "motion/react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Drag-to-reorder list. Drag the handle, or use the up/down buttons
 * (keyboard and screen reader friendly). `onReorder` gets the new order;
 * save it when the user is done (e.g. on drop or with a Save button).
 */
export function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  label,
  className,
}: {
  items: T[];
  getId: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Accessible name, e.g. "Services order". */
  label: string;
  className?: string;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      aria-label={label}
      className={cn("flex flex-col gap-2", className)}
    >
      {items.map((item, i) => (
        <SortableRow
          key={getId(item)}
          item={item}
          index={i}
          count={items.length}
          onMove={move}
        >
          {renderItem(item, i)}
        </SortableRow>
      ))}
    </Reorder.Group>
  );
}

function SortableRow<T>({
  item,
  index,
  count,
  onMove,
  children,
}: {
  item: T;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  children: React.ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.01,
        boxShadow: "0 20px 40px -20px rgb(0 8 107 / 0.35)",
      }}
      className="relative flex items-center gap-2 rounded-[10px] bg-white py-2 pr-2 pl-1 ring-1 ring-black/[0.06]"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        tabIndex={-1}
        onPointerDown={(e) => controls.start(e)}
        className="text-surface-muted hover:text-surface-fg flex h-10 w-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
      >
        <GripVertical aria-hidden className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          aria-label={`Move up (position ${index + 1} of ${count})`}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
          className="text-surface-muted hover:bg-ice hover:text-royal inline-flex size-6 items-center justify-center rounded disabled:opacity-30"
        >
          <ChevronUp aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Move down (position ${index + 1} of ${count})`}
          disabled={index === count - 1}
          onClick={() => onMove(index, index + 1)}
          className="text-surface-muted hover:bg-ice hover:text-royal inline-flex size-6 items-center justify-center rounded disabled:opacity-30"
        >
          <ChevronDown aria-hidden className="size-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}
