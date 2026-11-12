"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Popover } from "radix-ui";
import { CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/site/button";

/**
 * "Custom" in the date range row: pick a first and last day, then Apply.
 * The dates go in the address (?from=…&to=…) so the view can be shared.
 */
export function CustomRange({
  active,
  from,
  to,
  today,
}: {
  active: boolean;
  from: string;
  to: string;
  /** Today's date (YYYY-MM-DD, Lagos), the latest day you can pick. */
  today: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);
  const valid = !!start && !!end && start <= end && end <= today;

  const apply = () => {
    if (!valid) return;
    setOpen(false);
    router.push(`/admin?from=${start}&to=${end}#insights-title`, {
      scroll: false,
    });
  };

  const field =
    "border-charcoal/[0.18] focus:border-brand h-11 w-full rounded-[8px] border bg-white px-3 text-sm outline-none focus:shadow-[0_0_0_3px_rgb(0_171_255/0.2)]";

  return (
    <Popover.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setStart(from);
          setEnd(to);
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-current={active ? "true" : undefined}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors",
            active
              ? "text-royal bg-white shadow-sm"
              : "text-surface-muted hover:text-surface-fg",
          )}
        >
          <CalendarRange aria-hidden className="size-4" />
          Custom
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="dx-site data-[state=open]:animate-in data-[state=open]:fade-in-0 z-50 w-72 rounded-[12px] bg-white p-4 shadow-[0_24px_60px_-20px_rgb(0_8_107/0.4)] ring-1 ring-black/[0.06]"
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              apply();
            }}
          >
            <p className="text-sm font-bold">Choose dates</p>
            <label className="flex flex-col gap-1 text-xs font-bold">
              From
              <input
                type="date"
                value={start}
                max={end || today}
                onChange={(e) => setStart(e.target.value)}
                className={field}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold">
              To
              <input
                type="date"
                value={end}
                min={start}
                max={today}
                onChange={(e) => setEnd(e.target.value)}
                className={field}
                required
              />
            </label>
            {start && end && start > end && (
              <p role="alert" className="text-xs font-bold text-[#c2410c]">
                The first day must come before the last.
              </p>
            )}
            <p className="text-surface-muted text-xs leading-relaxed">
              Compared with the same number of days just before. Up to about
              three years.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="subtle"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!valid}>
                Apply
              </Button>
            </div>
          </form>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
