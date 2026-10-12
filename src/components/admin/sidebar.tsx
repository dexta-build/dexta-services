"use client";

import type { ComponentType } from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Mail,
  LogOut,
  Menu,
  X,
  User,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface AdminSidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
  unreadContactMessages?: number;
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

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminSidebar({
  user,
  unreadContactMessages = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const profileRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navGroups: NavGroup[] = [
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
      basePaths: ["/admin/events", "/admin/registrations", "/admin/messaging"],
      items: [
        { href: "/admin/events", label: "Events", icon: CalendarDays },
        { href: "/admin/registrations", label: "Registrations", icon: Users },
        { href: "/admin/messaging", label: "Messaging", icon: Mail },
      ],
    },
  ];

  // Auto-expand the group that owns the current page
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of navGroups) {
      initial[group.label] = group.basePaths.some((p) =>
        pathname.startsWith(p),
      );
    }
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (item: NavItem) => {
    const [pathOnly] = item.href.split("?");

    if (!pathname.startsWith(pathOnly)) {
      return false;
    }

    if (item.section) {
      return searchParams.get("section") === item.section;
    }

    return true;
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: globalThis.MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as globalThis.Node)
      ) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2 px-2 py-4">
        <Image
          src="/images/dexta1.png"
          alt="Dexta Logo"
          width={80}
          height={40}
          priority
          className="h-auto w-[80px]"
        />
      </Link>

      {/* Navigation */}
      <nav
        className="flex-1 min-h-0 overflow-y-auto space-y-1 px-3 py-4 scrollbar-thin scrollbar-thumb-[#262626] scrollbar-track-transparent hover:scrollbar-thumb-[#363636]"
        aria-label="Admin navigation"
      >
        {/* Dashboard — standalone */}
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          aria-current={pathname === "/admin" ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/admin"
              ? "bg-cyan-500/10 text-cyan-400"
              : "text-[#888] hover:bg-[#1a1a1a] hover:text-white",
          )}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
          Dashboard
        </Link>

        {navGroups.map((group) => {
          const isOpen = openGroups[group.label] ?? false;
          const groupActive = group.basePaths.some((p) =>
            pathname.startsWith(p),
          );

          return (
            <div key={group.label}>
              {/* Group toggle button */}
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  groupActive && !isOpen
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-[#888] hover:bg-[#1a1a1a] hover:text-white",
                )}
              >
                <group.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">{group.label}</span>
                {group.badgeCount ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-semibold text-black">
                    {group.badgeCount}
                  </span>
                ) : null}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                    isOpen ? "rotate-180" : "rotate-0",
                  )}
                  aria-hidden="true"
                />
              </button>

              {/* Child items */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                )}
              >
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-[#222] pl-3 pb-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive(item) ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive(item)
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "text-[#666] hover:bg-[#1a1a1a] hover:text-white",
                      )}
                    >
                      <item.icon
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badgeCount ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-semibold text-black">
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

      {/* User info + Logout */}
      <div className="border-t border-[#222] p-4">
        <div className="mb-3">
          <p className="truncate text-sm font-medium text-white">
            {user?.name ?? "Admin"}
          </p>
          <p className="truncate text-xs text-[#999]">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full justify-start gap-2 text-[#888] hover:bg-red-950/30 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top navbar */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-black/80 px-4 backdrop-blur-md lg:hidden">
        {/* Left: menu + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-white hover:bg-white/10"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/admin">
            <Image
              src="/images/dexta1.png"
              alt="Dexta Logo"
              width={70}
              height={32}
              priority
              className="h-7 w-auto"
            />
          </Link>
        </div>

        {/* Right: profile icon */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#222] text-white transition-colors hover:bg-[#333]"
            aria-label="Profile menu"
          >
            <User className="h-4 w-4" />
          </button>

          {/* Profile dropdown */}
          <div
            className={cn(
              "absolute right-0 top-full mt-2 w-56 rounded-xl border border-[#222] bg-[#111] p-2 shadow-2xl transition-all duration-200",
              profileOpen
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-2 opacity-0",
            )}
          >
            <div className="mb-1 border-b border-[#222] px-3 py-2.5">
              <p className="truncate text-sm font-medium text-white">
                {user?.name ?? "Admin"}
              </p>
              <p className="truncate text-xs text-[#666]">{user?.email}</p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#888] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              onClick={() => setProfileOpen(false)}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Go to website
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#888] transition-colors hover:bg-red-950/30 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[60] transition-opacity duration-300 lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <div
          className="absolute inset-0 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "relative h-full w-64 bg-[#111] shadow-2xl transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-4 z-10 rounded-lg p-1 text-[#888] hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
          {sidebar}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 border-r border-[#222] bg-[#111] lg:block">
        {sidebar}
      </div>
    </>
  );
}
