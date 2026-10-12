"use client";

import type { ComponentType, ReactNode } from "react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Mail,
  LogOut,
  Menu,
  X,
  ExternalLink,
  PanelTop,
  Home,
  ChevronDown,
  Quote,
  Sparkles,
  Layers,
  Image as ImageIcon,
  HandCoins,
  Info,
  GraduationCap,
  Share2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminShellProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
  unreadContactMessages?: number;
  children: ReactNode;
}

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  section?: string;
  badgeCount?: number;
};

type NavGroup = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  basePaths: string[];
  items: NavItem[];
  badgeCount?: number;
};

export function AdminShell({
  user,
  unreadContactMessages = 0,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Desktop sidebar collapsed state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dexta_admin_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("dexta_admin_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        label: "Homepage",
        icon: Home,
        basePaths: [
          "/admin/hero",
          "/admin/manifesto",
          "/admin/expressions",
          "/admin/services",
        ],
        items: [
          { href: "/admin/hero", label: "Hero Section", icon: PanelTop },
          { href: "/admin/manifesto", label: "Manifesto", icon: Quote },
          { href: "/admin/expressions", label: "Expressions", icon: Sparkles },
          { href: "/admin/services", label: "Project Section", icon: Layers },
        ],
      },
      {
        label: "Projects",
        icon: ImageIcon,
        basePaths: ["/admin/projects-hero", "/admin/portfolio"],
        items: [
          {
            href: "/admin/projects-hero",
            label: "Portfolio Page",
            icon: PanelTop,
          },
          { href: "/admin/portfolio", label: "Portfolio", icon: ImageIcon },
        ],
      },
      {
        label: "About",
        icon: Info,
        basePaths: ["/admin/about"],
        items: [
          { href: "/admin/about/hero", label: "Hero Section", icon: PanelTop },
          { href: "/admin/about/story", label: "Story Section", icon: Quote },
          {
            href: "/admin/about/expertise",
            label: "Expertise Section",
            icon: Layers,
          },
          { href: "/admin/about/team", label: "Team Section", icon: Users },
          { href: "/admin/about/space", label: "Our Space", icon: ImageIcon },
          {
            href: "/admin/about/values",
            label: "Values Section",
            icon: Sparkles,
          },
          { href: "/admin/about/cta", label: "Bottom CTA", icon: HandCoins },
        ],
      },
      {
        label: "Contact",
        icon: Mail,
        basePaths: ["/admin/contact"],
        badgeCount: unreadContactMessages,
        items: [
          {
            href: "/admin/contact?section=content",
            label: "Page Content",
            icon: PanelTop,
            section: "content",
          },
          {
            href: "/admin/contact?section=socials",
            label: "Social Links",
            icon: ExternalLink,
            section: "socials",
          },
          {
            href: "/admin/contact?section=messages",
            label: "Messages Inbox",
            icon: Mail,
            section: "messages",
            badgeCount: unreadContactMessages,
          },
        ],
      },
      {
        label: "Offers",
        icon: Layers,
        basePaths: ["/admin/offers"],
        items: [
          {
            href: "/admin/offers/content",
            label: "Page Content",
            icon: PanelTop,
          },
          { href: "/admin/offers/plans", label: "Offers", icon: HandCoins },
        ],
      },
      {
        label: "We Brand Schools",
        icon: GraduationCap,
        basePaths: ["/admin/we-brand-schools"],
        items: [
          {
            href: "/admin/we-brand-schools/content",
            label: "Content",
            icon: PanelTop,
          },
          {
            href: "/admin/we-brand-schools/testimonials",
            label: "Testimonials",
            icon: Quote,
          },
          {
            href: "/admin/we-brand-schools/templates",
            label: "Templates",
            icon: ImageIcon,
          },
          {
            href: "/admin/we-brand-schools/portal",
            label: "Portal",
            icon: LayoutDashboard,
          },
          {
            href: "/admin/we-brand-schools/applications",
            label: "Applications",
            icon: Users,
          },
          {
            href: "/admin/we-brand-schools/referrals",
            label: "Referrals",
            icon: Share2,
          },
        ],
      },
      {
        label: "Events",
        icon: CalendarDays,
        basePaths: [
          "/admin/events",
          "/admin/registrations",
          "/admin/messaging",
        ],
        items: [
          { href: "/admin/events", label: "Events", icon: CalendarDays },
          { href: "/admin/registrations", label: "Registrations", icon: Users },
          { href: "/admin/messaging", label: "Messaging", icon: Mail },
        ],
      },
    ],
    [unreadContactMessages],
  );

  // Auto-expand group that owns current page
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of navGroups) {
      initial[group.label] = group.basePaths.some((p) =>
        pathname.startsWith(p),
      );
    }
    return initial;
  });

  // Keep group open when navigating
  useEffect(() => {
    for (const group of navGroups) {
      if (group.basePaths.some((p) => pathname.startsWith(p))) {
        setOpenGroups((prev) => ({ ...prev, [group.label]: true }));
      }
    }
  }, [pathname, navGroups]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (item: NavItem) => {
    const [pathOnly] = item.href.split("?");
    if (!pathname.startsWith(pathOnly)) return false;
    if (item.section) {
      return searchParams.get("section") === item.section;
    }
    return true;
  };

  // Lock body scroll on mobile drawer
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Compute breadcrumb / page title hint
  const currentSectionLabel = useMemo(() => {
    if (pathname === "/admin") return "Overview";
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isActive(item)) {
          return `${group.label} / ${item.label}`;
        }
      }
      if (group.basePaths.some((p) => pathname.startsWith(p))) {
        return group.label;
      }
    }
    return "Dashboard";
  }, [pathname, navGroups, searchParams]);

  const userInitials = useMemo(() => {
    if (!user?.name) return "A";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user?.name]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="fixed inset-0 flex overflow-hidden bg-black text-white">
        {/* =========================================================================
            DESKTOP SIDEBAR
        ========================================================================== */}
        <aside
          className={cn(
            "hidden shrink-0 border-r border-[#222] bg-[#111] transition-all duration-300 ease-in-out lg:flex lg:flex-col",
            isCollapsed ? "w-20" : "w-64",
          )}
        >
          {/* Sidebar Top: Logo + Collapse Button */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#222] px-4">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 overflow-hidden transition-all",
                isCollapsed ? "justify-center w-full" : "",
              )}
            >
              <Image
                src="/images/dexta1.png"
                alt="Dexta Logo"
                width={80}
                height={36}
                priority
                className={cn(
                  "h-7 w-auto object-contain",
                  isCollapsed && "scale-90",
                )}
              />
            </Link>

            {!isCollapsed && (
              <button
                type="button"
                onClick={toggleCollapsed}
                className="rounded-lg p-1.5 text-[#777] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Navigation - Fully Scrollable */}
          <nav
            className="flex-1 min-h-0 overflow-y-auto px-2.5 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-[#262626] scrollbar-track-transparent hover:scrollbar-thumb-[#363636]"
            aria-label="Admin desktop navigation"
          >
            {/* Dashboard Link */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin"
                    aria-current={pathname === "/admin" ? "page" : undefined}
                    className={cn(
                      "flex h-10 w-full items-center justify-center rounded-xl transition-colors",
                      pathname === "/admin"
                        ? "bg-cyan-500/15 text-cyan-400 font-semibold shadow-inner"
                        : "text-[#888] hover:bg-[#1a1a1a] hover:text-white",
                    )}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="sr-only">Dashboard</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Dashboard</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/admin"
                aria-current={pathname === "/admin" ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/admin"
                    ? "bg-cyan-500/15 text-cyan-400"
                    : "text-[#888] hover:bg-[#1a1a1a] hover:text-white",
                )}
              >
                <LayoutDashboard
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span>Dashboard</span>
              </Link>
            )}

            {/* Nav Groups */}
            {navGroups.map((group) => {
              const isOpen = openGroups[group.label] ?? false;
              const isGroupActive = group.basePaths.some((p) =>
                pathname.startsWith(p),
              );

              if (isCollapsed) {
                // Collapsed: Dropdown / Tooltip
                return (
                  <DropdownMenu key={group.label}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "relative flex h-10 w-full items-center justify-center rounded-xl transition-colors",
                              isGroupActive
                                ? "bg-cyan-500/15 text-cyan-400 font-semibold"
                                : "text-[#888] hover:bg-[#1a1a1a] hover:text-white",
                            )}
                          >
                            <group.icon className="h-5 w-5" />
                            {group.badgeCount ? (
                              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400" />
                            ) : null}
                            <span className="sr-only">{group.label}</span>
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {group.label}
                      </TooltipContent>
                    </Tooltip>

                    <DropdownMenuContent
                      side="right"
                      align="start"
                      className="w-52 border-[#222] bg-[#141414] p-1.5 shadow-2xl"
                    >
                      <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#666]">
                        {group.label}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-[#222]" />
                      {group.items.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer",
                              isActive(item)
                                ? "bg-cyan-500/15 text-cyan-400 font-semibold"
                                : "text-[#bbb] hover:bg-[#1f1f1f] hover:text-white",
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0 text-[#777]" />
                            <span className="flex-1">{item.label}</span>
                            {item.badgeCount ? (
                              <span className="rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                                {item.badgeCount}
                              </span>
                            ) : null}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              // Expanded group accordion
              return (
                <div key={group.label} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      isGroupActive && !isOpen
                        ? "bg-cyan-500/15 text-cyan-400"
                        : "text-[#888] hover:bg-[#1a1a1a] hover:text-white",
                    )}
                  >
                    <group.icon
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-left">{group.label}</span>
                    {group.badgeCount ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                        {group.badgeCount}
                      </span>
                    ) : null}
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                        isOpen
                          ? "rotate-180 text-white"
                          : "rotate-0 text-[#666]",
                      )}
                    />
                  </button>

                  {/* Child Items */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-200",
                      isOpen
                        ? "max-h-[500px] opacity-100"
                        : "max-h-0 opacity-0",
                    )}
                  >
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-[#222] pl-3 pb-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={isActive(item) ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                            isActive(item)
                              ? "bg-cyan-500/15 text-cyan-300 font-semibold"
                              : "text-[#777] hover:bg-[#1a1a1a] hover:text-white",
                          )}
                        >
                          <item.icon
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badgeCount ? (
                            <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1.5 py-0.2 text-[9px] font-bold text-black">
                              {item.badgeCount}
                            </span>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer: Toggle button when collapsed */}
          {isCollapsed && (
            <div className="border-t border-[#222] p-3 flex justify-center">
              <button
                type="button"
                onClick={toggleCollapsed}
                className="rounded-lg p-2 text-[#777] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            </div>
          )}
        </aside>

        {/* =========================================================================
            MOBILE SIDEBAR DRAWER
        ========================================================================== */}
        <div
          className={cn(
            "fixed inset-0 z-[70] transition-opacity duration-300 lg:hidden",
            mobileOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={cn(
              "relative h-full w-72 bg-[#111] shadow-2xl transition-transform duration-300 ease-out flex flex-col",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            {/* Mobile Header */}
            <div className="flex h-16 items-center justify-between border-b border-[#222] px-4">
              <Link href="/admin" onClick={() => setMobileOpen(false)}>
                <Image
                  src="/images/dexta1.png"
                  alt="Dexta Logo"
                  width={80}
                  height={36}
                  priority
                  className="h-7 w-auto"
                />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-[#888] hover:bg-[#1a1a1a] hover:text-white"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation - Scrollable */}
            <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1.5">
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/admin"
                    ? "bg-cyan-500/15 text-cyan-400"
                    : "text-[#888] hover:bg-[#1a1a1a] hover:text-white",
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span>Dashboard</span>
              </Link>

              {navGroups.map((group) => {
                const isOpen = openGroups[group.label] ?? false;
                const isGroupActive = group.basePaths.some((p) =>
                  pathname.startsWith(p),
                );

                return (
                  <div key={group.label} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.label)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        isGroupActive && !isOpen
                          ? "bg-cyan-500/15 text-cyan-400"
                          : "text-[#888] hover:bg-[#1a1a1a] hover:text-white",
                      )}
                    >
                      <group.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{group.label}</span>
                      {group.badgeCount ? (
                        <span className="rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                          {group.badgeCount}
                        </span>
                      ) : null}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-transform",
                          isOpen ? "rotate-180" : "rotate-0",
                        )}
                      />
                    </button>

                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-200",
                        isOpen
                          ? "max-h-[500px] opacity-100"
                          : "max-h-0 opacity-0",
                      )}
                    >
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l border-[#222] pl-3 pb-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                              isActive(item)
                                ? "bg-cyan-500/15 text-cyan-300"
                                : "text-[#777] hover:bg-[#1a1a1a] hover:text-white",
                            )}
                          >
                            <item.icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.badgeCount ? (
                              <span className="rounded-full bg-cyan-500 px-1.5 py-0.2 text-[9px] font-bold text-black">
                                {item.badgeCount}
                              </span>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Mobile Footer with Signout */}
            <div className="border-t border-[#222] p-4">
              <div className="mb-3">
                <p className="truncate text-sm font-medium text-white">
                  {user?.name ?? "Admin"}
                </p>
                <p className="truncate text-xs text-[#888]">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="w-full justify-start gap-2 text-red-400 hover:bg-red-950/30 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MAIN COLUMN: TOP HEADER + SCROLLABLE CONTENT
        ========================================================================== */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Top Admin Header Bar */}
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-[#222] bg-[#0d0d0d]/90 px-4 backdrop-blur-md sm:px-6">
            {/* Left: Toggles & Breadcrumb */}
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-[#888] hover:bg-[#1a1a1a] hover:text-white lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Desktop collapse/expand toggle */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className="hidden rounded-lg p-2 text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white lg:flex"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>

              {/* Location Badge */}
              <div className="flex items-center gap-1.5 text-xs text-[#666]">
                <span className="hidden font-mono uppercase tracking-widest sm:inline">
                  Admin
                </span>
                <ChevronRight className="hidden h-3.5 w-3.5 sm:inline" />
                <span className="font-medium text-white truncate max-w-[200px] sm:max-w-none">
                  {currentSectionLabel}
                </span>
              </div>
            </div>

            {/* Right: Quick actions & User menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Unread inbox link badge */}
              {unreadContactMessages > 0 && (
                <Link
                  href="/admin/contact?section=messages"
                  className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>
                    {unreadContactMessages}{" "}
                    <span className="hidden sm:inline">unread</span>
                  </span>
                </Link>
              )}

              {/* View Live Site */}
              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#141414] px-3 py-1.5 text-xs font-medium text-[#aaa] transition-colors hover:border-[#444] hover:bg-[#1c1c1c] hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Site</span>
              </Link>

              {/* User profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-[#222] bg-[#141414] p-1.5 pr-2.5 transition-colors hover:border-[#333] hover:bg-[#1a1a1a]"
                    aria-label="User menu"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-xs font-bold text-cyan-400">
                      {userInitials}
                    </div>
                    <span className="hidden text-xs font-medium text-[#eee] sm:inline max-w-[120px] truncate">
                      {user?.name ?? "Admin"}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-[#666]" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 border-[#222] bg-[#111] p-1 text-white shadow-2xl"
                >
                  <DropdownMenuLabel className="px-3 py-2">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name ?? "Admin"}
                    </p>
                    <p className="text-xs text-[#888] truncate">
                      {user?.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#222]" />

                  <DropdownMenuItem asChild>
                    <Link
                      href="/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#bbb] hover:text-white cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View Website</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-[#222]" />

                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/admin/login" })}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/20 cursor-pointer focus:bg-red-950/20 focus:text-red-300"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Scrollable Content */}
          <main className="flex-1 overflow-y-auto min-h-0 bg-black">
            <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
