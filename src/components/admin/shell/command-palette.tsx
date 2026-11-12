"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { signOut } from "next-auth/react";
import { CornerDownLeft, ExternalLink, LogOut, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/admin/kit/layout";
import { ACCOUNT_LINK, AccountIcon, type NavGroup } from "./nav";

type Command = {
  id: string;
  label: string;
  group: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
};

/**
 * ⌘K / Ctrl+K: jump to any admin page the user can open, or run an action.
 * Arrow keys move, Enter opens, Esc closes.
 */
export function CommandPalette({
  open,
  onOpenChange,
  nav,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nav: NavGroup[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<React.ComponentRef<"ul">>(null);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => {
      onOpenChange(false);
      router.push(href);
    };
    const pages = nav.flatMap((g) =>
      g.items.map((item) => ({
        id: item.href,
        label: g.items.length > 1 ? `${g.label}: ${item.label}` : item.label,
        group: "Go to",
        keywords:
          `${g.label} ${item.label} ${item.keywords ?? ""}`.toLowerCase(),
        icon: g.icon,
        run: go(item.href),
      })),
    );
    return [
      ...pages,
      {
        id: ACCOUNT_LINK.href,
        label: ACCOUNT_LINK.label,
        group: "Go to",
        keywords: `account ${ACCOUNT_LINK.keywords}`,
        icon: AccountIcon,
        run: go(ACCOUNT_LINK.href),
      },
      {
        id: "view-site",
        label: "View the website",
        group: "Actions",
        keywords: "open site public preview",
        icon: ExternalLink,
        run: () => {
          onOpenChange(false);
          window.open("/", "_blank", "noopener");
        },
      },
      {
        id: "sign-out",
        label: "Sign out",
        group: "Actions",
        keywords: "log out logout exit",
        icon: LogOut,
        run: () => {
          onOpenChange(false);
          void signOut({ callbackUrl: "/admin/login" });
        },
      },
    ];
  }, [nav, onOpenChange, router]);

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return commands;
    return commands.filter((c) => {
      const hay = `${c.label.toLowerCase()} ${c.keywords}`;
      return words.every((w) => hay.includes(w));
    });
  }, [commands, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[active]?.run();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[90] bg-royal/40 backdrop-blur-[2px]" />
        <Dialog.Content
          onKeyDown={onKeyDown}
          className="dx-site data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] fixed top-[12vh] left-1/2 z-[91] flex max-h-[70vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_30px_80px_-20px_rgb(0_8_107/0.5)]"
        >
          <Dialog.Title className="sr-only">Command menu</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search admin pages and actions. Use the arrow keys and Enter.
          </Dialog.Description>
          <div className="border-surface-rule flex items-center gap-3 border-b px-4">
            <Search
              aria-hidden
              className="text-surface-muted size-5 shrink-0"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              placeholder="Search pages and actions"
              aria-label="Search pages and actions"
              role="combobox"
              aria-expanded
              aria-controls="admin-command-list"
              aria-activedescendant={
                results[active] ? `cmd-${active}` : undefined
              }
              className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-[#737773]"
            />
            <Kbd>Esc</Kbd>
          </div>
          <ul
            ref={listRef}
            id="admin-command-list"
            role="listbox"
            aria-label="Results"
            className="flex-1 overflow-y-auto p-2"
          >
            {results.length === 0 && (
              <li className="text-surface-muted px-3 py-10 text-center text-sm">
                Nothing found for “{query}”.
              </li>
            )}
            {results.map((c, i) => {
              const header = results[i - 1]?.group !== c.group ? c.group : null;
              const Icon = c.icon;
              return (
                <li key={c.id} role="presentation">
                  {header && (
                    <p className="text-surface-muted px-3 pt-3 pb-1.5 text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
                      {header}
                    </p>
                  )}
                  <div
                    id={`cmd-${i}`}
                    role="option"
                    aria-selected={i === active}
                    data-index={i}
                    onMouseMove={() => setActive(i)}
                    onClick={c.run}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm",
                      i === active ? "bg-ice text-royal" : "text-charcoal",
                    )}
                  >
                    <Icon aria-hidden className="size-4 shrink-0 opacity-80" />
                    <span className="flex-1 truncate font-bold">{c.label}</span>
                    {i === active && (
                      <CornerDownLeft
                        aria-hidden
                        className="size-4 opacity-70"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
