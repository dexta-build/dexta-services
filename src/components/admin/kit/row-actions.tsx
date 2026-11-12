"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Dialog, DropdownMenu } from "radix-ui";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsPhone } from "./use-media-query";

export type RowAction =
  | {
      label: string;
      icon?: React.ReactNode;
      /** Run an action. Called after the menu has closed. */
      onSelect?: () => void;
      /** Or go somewhere. */
      href?: string;
      external?: boolean;
      danger?: boolean;
      disabled?: boolean;
      /** Leave the item out (e.g. no permission) without an `if` at the call site. */
      hidden?: boolean;
    }
  | "separator";

/**
 * The "⋯" menu for a row or card. A dropdown on tablets and desktops; a
 * bottom sheet with large tap targets on phones. Actions run after the
 * menu closes, so they can safely open a confirm dialog or side panel.
 *
 *   <RowActions label={`Actions for ${user.name}`} actions={[
 *     { label: "Edit", icon: <Pencil />, onSelect: edit },
 *     "separator",
 *     { label: "Delete", danger: true, onSelect: remove },
 *   ]} />
 */
export function RowActions({
  actions,
  label,
  title,
  className,
}: {
  actions: RowAction[];
  /** Accessible name for the button, e.g. "Actions for Brand refresh". */
  label: string;
  /** Heading shown at the top of the phone sheet (defaults to `label`). */
  title?: string;
  className?: string;
}) {
  const isPhone = useIsPhone();
  const [sheetOpen, setSheetOpen] = useState(false);
  const items = tidy(actions);
  if (items.length === 0) return null;

  // Let the menu finish closing (and give focus back) before acting.
  const run = (fn?: () => void) => {
    if (fn) window.setTimeout(fn, 0);
  };

  const trigger = (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        if (isPhone) setSheetOpen(true);
      }}
      className={cn(
        "text-surface-fg hover:bg-charcoal/[0.07] data-[state=open]:bg-ice data-[state=open]:text-royal inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)] sm:size-9",
        className,
      )}
    >
      <MoreHorizontal aria-hidden className="size-[18px]" />
    </button>
  );

  if (isPhone) {
    return (
      <>
        {trigger}
        <Dialog.Root open={sheetOpen} onOpenChange={setSheetOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[85] bg-royal/40" />
            <Dialog.Content
              onClick={(e) => e.stopPropagation()}
              className="dx-site data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom fixed inset-x-0 bottom-0 z-[86] max-h-[85dvh] overflow-y-auto rounded-t-[18px] bg-white px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] duration-300"
            >
              <span
                aria-hidden
                className="mx-auto mb-2 block h-1 w-10 rounded-full bg-charcoal/20"
              />
              <Dialog.Title className="text-surface-muted truncate px-3 pb-2 text-xs font-bold tracking-[0.06em] uppercase">
                {title ?? label}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Choose an action
              </Dialog.Description>
              <ul className="flex flex-col">
                {items.map((a, i) =>
                  a === "separator" ? (
                    <li
                      key={`sep-${i}`}
                      aria-hidden
                      className="bg-surface-rule mx-3 my-1 h-px"
                    />
                  ) : (
                    <li key={a.label}>
                      <SheetItem
                        action={a}
                        onDone={() => {
                          setSheetOpen(false);
                          run(a.onSelect);
                        }}
                      />
                    </li>
                  ),
                )}
              </ul>
              <Dialog.Close className="bg-canvas mt-2 flex h-12 w-full items-center justify-center rounded-[12px] text-[0.9375rem] font-bold">
                Cancel
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </>
    );
  }

  const item =
    "flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm font-bold outline-none data-[highlighted]:bg-ice data-[highlighted]:text-royal data-[disabled]:pointer-events-none data-[disabled]:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0";
  const danger =
    "text-[#c2410c] data-[highlighted]:bg-coral-soft data-[highlighted]:text-[#c2410c]";

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          collisionPadding={12}
          onClick={(e) => e.stopPropagation()}
          className="dx-site data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-52 overflow-y-auto rounded-[12px] bg-white p-1.5 shadow-[0_24px_60px_-20px_rgb(0_8_107/0.4)] ring-1 ring-black/[0.06]"
        >
          {items.map((a, i) =>
            a === "separator" ? (
              <DropdownMenu.Separator
                key={`sep-${i}`}
                className="bg-surface-rule my-1 h-px"
              />
            ) : a.href ? (
              <DropdownMenu.Item
                key={a.label}
                asChild
                disabled={a.disabled}
                className={cn(item, a.danger && danger)}
              >
                <ActionLink action={a} />
              </DropdownMenu.Item>
            ) : (
              <DropdownMenu.Item
                key={a.label}
                disabled={a.disabled}
                onSelect={() => run(a.onSelect)}
                className={cn(item, a.danger && danger)}
              >
                {a.icon && <span aria-hidden>{a.icon}</span>}
                {a.label}
              </DropdownMenu.Item>
            ),
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/** Drop hidden items and stray or doubled separators. */
function tidy(actions: RowAction[]) {
  const out: RowAction[] = [];
  for (const a of actions) {
    if (a !== "separator" && a.hidden) continue;
    if (a === "separator" && (out.length === 0 || out.at(-1) === "separator"))
      continue;
    out.push(a);
  }
  if (out.at(-1) === "separator") out.pop();
  return out;
}

type ActionItem = Exclude<RowAction, "separator">;

function ActionLink({
  action,
  ...rest
}: { action: ActionItem } & React.HTMLAttributes<HTMLElement>) {
  const inner = (
    <Fragment>
      {action.icon && <span aria-hidden>{action.icon}</span>}
      {action.label}
    </Fragment>
  );
  return action.external ? (
    <a href={action.href} target="_blank" rel="noopener noreferrer" {...rest}>
      {inner}
    </a>
  ) : (
    <Link href={action.href!} {...rest}>
      {inner}
    </Link>
  );
}

function SheetItem({
  action,
  onDone,
}: {
  action: ActionItem;
  onDone: () => void;
}) {
  const cls = cn(
    "flex h-12 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[0.9375rem] font-bold active:bg-ice disabled:opacity-40 [&_svg]:size-5 [&_svg]:shrink-0",
    action.danger ? "text-[#c2410c] active:bg-coral-soft" : "text-charcoal",
  );
  if (action.href && !action.disabled) {
    return <ActionLink action={action} className={cls} onClick={onDone} />;
  }
  return (
    <button
      type="button"
      disabled={action.disabled}
      onClick={onDone}
      className={cls}
    >
      {action.icon && <span aria-hidden>{action.icon}</span>}
      {action.label}
    </button>
  );
}
