"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { Dialog, DropdownMenu } from "radix-ui";
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ROLE_LABELS,
  type AdminRole,
  CONTENT_AREAS,
  ADMIN_ONLY_AREAS,
} from "@/lib/admin/permissions";
import { ConfirmProvider } from "@/components/admin/kit/feedback";
import { Kbd, StatusPill } from "@/components/admin/kit/layout";
import { CommandPalette } from "./command-palette";
import {
  ACCOUNT_LINK,
  AccountIcon,
  isLinkActive,
  navFor,
  type NavGroup,
} from "./nav";

export type ShellUser = {
  name: string;
  email: string;
  role: AdminRole;
  access: string[];
};

const AREA_LABELS: Record<string, string> = {
  ...Object.fromEntries(CONTENT_AREAS.map((a) => [a.key, a.label])),
  ...Object.fromEntries(
    ADMIN_ONLY_AREAS.map((a) => [a, a[0].toUpperCase() + a.slice(1)]),
  ),
};

/**
 * The admin frame in the site's design: a light sidebar with the menu
 * (only what this user can open), a top bar with search (⌘K), View site
 * and the user menu, and a drawer menu on phones.
 */
export function AdminShell({
  user,
  unreadMessages = 0,
  children,
}: {
  user: ShellUser;
  unreadMessages?: number;
  children: React.ReactNode;
}) {
  const nav = useMemo(() => navFor(user), [user]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPaletteChange = useCallback(
    (open: boolean) => setPaletteOpen(open),
    [],
  );

  return (
    <ConfirmProvider>
      <div className="dx-site flex min-h-dvh">
        <a
          href="#admin-main"
          className="bg-royal sr-only z-[100] rounded-full px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>

        <aside className="border-surface-rule sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r bg-white lg:flex">
          <SidebarContents nav={nav} unread={unreadMessages} />
        </aside>

        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[60] bg-royal/30 backdrop-blur-[2px] lg:hidden" />
            <Dialog.Content className="dx-site data-[state=open]:animate-in data-[state=open]:slide-in-from-left fixed inset-y-0 left-0 z-[61] flex w-[min(300px,86vw)] flex-col bg-white shadow-2xl duration-300 lg:hidden">
              <Dialog.Title className="sr-only">Admin menu</Dialog.Title>
              <Dialog.Description className="sr-only">
                Pages you can manage
              </Dialog.Description>
              <Dialog.Close
                aria-label="Close menu"
                className="hover:bg-charcoal/[0.07] absolute top-4 right-3 z-10 inline-flex size-9 items-center justify-center rounded-full"
              >
                <X aria-hidden className="size-5" />
              </Dialog.Close>
              <SidebarContents
                nav={nav}
                unread={unreadMessages}
                onNavigate={() => setMobileOpen(false)}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-surface-rule bg-canvas/85 sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md md:px-8">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="hover:bg-charcoal/[0.07] -ml-1 inline-flex size-10 items-center justify-center rounded-full lg:hidden"
            >
              <Menu aria-hidden className="size-5" />
            </button>
            <Link href="/admin" className="lg:hidden" aria-label="Dashboard">
              <Image
                src="/images/dexta.png"
                alt="Dexta"
                width={425}
                height={134}
                className="h-6 w-auto"
              />
            </Link>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="text-surface-muted hover:text-surface-fg ml-auto inline-flex h-10 items-center gap-2.5 rounded-full bg-white px-3.5 text-sm ring-1 ring-black/[0.08] transition-colors md:mr-auto md:ml-0 md:w-80"
            >
              <Search aria-hidden className="size-4" />
              <span className="hidden flex-1 text-left md:inline">
                Search pages and actions
              </span>
              <span className="sr-only md:hidden">Search</span>
              <span className="hidden items-center gap-0.5 md:inline-flex">
                <Kbd>Ctrl</Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-fg hover:bg-charcoal/[0.07] hidden h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold sm:inline-flex"
            >
              View site <ExternalLink aria-hidden className="size-3.5" />
            </a>

            <UserMenu user={user} />
          </header>

          <DeniedNotice />

          <main id="admin-main" className="flex-1 px-4 py-8 md:px-8 md:py-10">
            <div className="mx-auto w-full max-w-[1200px]">{children}</div>
          </main>
        </div>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={onPaletteChange}
        nav={nav}
      />
    </ConfirmProvider>
  );
}

function SidebarContents({
  nav,
  unread,
  onNavigate,
}: {
  nav: NavGroup[];
  unread: number;
  /** Called when a link is followed (closes the phone menu). */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const section = useSearchParams().get("section");
  // One group open at a time: the current page's group, or the last opened.
  const activeGroup =
    nav.find(
      (g) =>
        g.items.length > 1 &&
        g.items.some((i) => isLinkActive(i.href, pathname, section)),
    )?.label ?? null;
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup);
  useEffect(() => {
    if (activeGroup) setOpenGroup(activeGroup);
  }, [activeGroup]);

  const onClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) onNavigate?.();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col" onClick={onClick}>
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <Link
          href="/admin"
          aria-label="Dashboard"
          className="inline-flex items-center gap-2.5"
        >
          <Image
            src="/images/dexta.png"
            alt="Dexta"
            width={425}
            height={134}
            className="h-7 w-auto"
            priority
          />
          <span className="bg-ice text-royal rounded-full px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.06em] uppercase">
            Admin
          </span>
        </Link>
      </div>
      <nav
        aria-label="Admin"
        className="flex-1 overflow-y-auto overscroll-contain px-3 pb-6"
      >
        <ul className="flex flex-col gap-0.5">
          {nav.map((g) => {
            const Icon = g.icon;
            const groupActive = g.items.some((i) =>
              isLinkActive(i.href, pathname, section),
            );
            const hasBadge =
              g.items.some((i) => i.badge === "unread") && unread > 0;
            if (g.items.length === 1) {
              const item = g.items[0];
              return (
                <li key={g.label}>
                  <NavRow
                    href={item.href}
                    active={groupActive}
                    icon={<Icon className="size-[18px]" />}
                  >
                    {item.label}
                    {item.badge === "unread" && unread > 0 && (
                      <span className="ml-auto">
                        <Badge count={unread} />
                      </span>
                    )}
                  </NavRow>
                </li>
              );
            }
            const isOpen = openGroup === g.label;
            return (
              <li key={g.label}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenGroup(isOpen ? null : g.label)}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-[8px] px-3 text-left text-sm font-bold transition-colors",
                    groupActive
                      ? "text-royal"
                      : "text-charcoal hover:bg-canvas",
                  )}
                >
                  <Icon aria-hidden className="size-[18px] shrink-0" />
                  <span className="flex-1 truncate">{g.label}</span>
                  {hasBadge && !isOpen && <Badge count={unread} />}
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "size-4 opacity-60 transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                {isOpen && (
                  <ul className="border-surface-rule mt-0.5 mb-1.5 ml-[21px] flex flex-col gap-0.5 border-l pl-2.5">
                    {g.items.map((item) => (
                      <li key={item.href}>
                        <NavRow
                          href={item.href}
                          active={isLinkActive(item.href, pathname, section)}
                          sub
                        >
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge === "unread" && unread > 0 && (
                            <Badge count={unread} />
                          )}
                        </NavRow>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-surface-rule border-t p-3">
        <NavRow
          href={ACCOUNT_LINK.href}
          active={pathname.startsWith(ACCOUNT_LINK.href)}
          icon={<AccountIcon className="size-[18px]" />}
        >
          {ACCOUNT_LINK.label}
        </NavRow>
      </div>
    </div>
  );
}

function NavRow({
  href,
  active,
  icon,
  sub,
  children,
}: {
  href: string;
  active: boolean;
  icon?: React.ReactNode;
  sub?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[8px] px-3 text-sm transition-colors",
        sub ? "h-9 font-medium" : "h-10 font-bold",
        active
          ? "bg-ice text-royal font-bold"
          : "text-charcoal hover:bg-canvas",
      )}
    >
      {icon && (
        <span aria-hidden className="shrink-0">
          {icon}
        </span>
      )}
      {children}
    </Link>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="bg-brand-cyan text-royal inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.6875rem] font-bold">
      <span className="sr-only">Unread: </span>
      {count > 99 ? "99+" : count}
    </span>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  const initials =
    user.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "A";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Your account menu"
        className="hover:bg-charcoal/[0.07] inline-flex h-10 items-center gap-2 rounded-full pr-2 pl-1 outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)]"
      >
        <span className="bg-royal inline-flex size-8 items-center justify-center rounded-full text-xs font-bold text-white">
          {initials}
        </span>
        <ChevronDown aria-hidden className="size-4 opacity-60" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="dx-site data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 z-50 w-64 rounded-[12px] bg-white p-1.5 shadow-[0_24px_60px_-20px_rgb(0_8_107/0.4)] ring-1 ring-black/[0.06]"
        >
          <div className="flex flex-col gap-1.5 px-3 py-2.5">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="text-surface-muted truncate text-xs">{user.email}</p>
            <StatusPill
              tone={user.role === "ADMIN" ? "royal" : "brand"}
              className="self-start"
            >
              {ROLE_LABELS[user.role]}
            </StatusPill>
          </div>
          <DropdownMenu.Separator className="bg-surface-rule my-1 h-px" />
          <MenuLink
            href={ACCOUNT_LINK.href}
            icon={<AccountIcon className="size-4" />}
          >
            Your account
          </MenuLink>
          <DropdownMenu.Item asChild>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="data-[highlighted]:bg-ice data-[highlighted]:text-royal flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm font-bold outline-none"
            >
              <ExternalLink aria-hidden className="size-4" /> View site
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="bg-surface-rule my-1 h-px" />
          <DropdownMenu.Item
            onSelect={() => void signOut({ callbackUrl: "/admin/login" })}
            className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm font-bold text-[#c2410c] outline-none data-[highlighted]:bg-coral-soft"
          >
            <LogOut aria-hidden className="size-4" /> Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link
        href={href}
        className="data-[highlighted]:bg-ice data-[highlighted]:text-royal flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm font-bold outline-none"
      >
        <span aria-hidden>{icon}</span>
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}

/** Shown after the proxy sends someone back from a page they can't open. */
function DeniedNotice() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const denied = params.get("denied");
  if (!denied) return null;
  const dismiss = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("denied");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  };
  return (
    <div role="status" className="px-4 pt-6 md:px-8">
      <div className="bg-gold-soft text-gold-deep mx-auto flex max-w-[1200px] items-start gap-3 rounded-[10px] px-4 py-3 text-sm">
        <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
        <p className="flex-1">
          <strong>
            You don&apos;t have access to {AREA_LABELS[denied] ?? "that page"}.
          </strong>{" "}
          Ask an Admin if you need it.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="-m-1 p-1"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
