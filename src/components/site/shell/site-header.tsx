"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  headerSurfaceFor,
  isActivePath,
  type NavLink,
  type ResourceHighlight,
} from "@/lib/site/navigation";
import type { ContactSocialLinkData } from "@/lib/contact-defaults";
import { Button } from "../button";
import { Container } from "../container";
import { Logo } from "./logo";
import { CataloguesPanel, ResourcesPanel, ServicesPanel } from "./mega-menu";
import { MobileMenu } from "./mobile-menu";
import { useSiteNav, type SiteNav } from "./nav-context";

type MenuKey = "services" | "catalogues" | "resources";

type Menu = { key: MenuKey; label: string; bases: string[] };

/** Menus and desktop order (Resources right after its link), from settings. */
function buildNav(nav: SiteNav) {
  const menus: Record<MenuKey, Menu> = {
    services: {
      key: "services",
      label: nav.labels.services,
      bases: ["/services"],
    },
    catalogues: {
      key: "catalogues",
      label: nav.labels.catalogues,
      bases: ["/catalogue"],
    },
    resources: {
      key: "resources",
      label: nav.labels.resources,
      // The link it follows keeps its own highlight, so it isn't counted here.
      bases: nav.resources
        .map((r) => r.href)
        .filter((h) => h !== nav.resourcesAfter),
    },
  };
  const hasAnchor = nav.mainLinks.some((l) => l.href === nav.resourcesAfter);
  const order: NavItem[] = [
    { menu: "services" },
    { menu: "catalogues" },
    ...nav.mainLinks.flatMap((link): NavItem[] =>
      link.href === nav.resourcesAfter
        ? [{ link }, { menu: "resources" }]
        : [{ link }],
    ),
    ...(hasAnchor || nav.resources.length === 0
      ? []
      : [{ menu: "resources" } as NavItem]),
  ];
  return { menus, order };
}

type NavItem = { menu: MenuKey } | { link: NavLink };

const CLOSE_DELAY_MS = 140;

export type SiteHeaderProps = {
  whatsappHref: string | null;
  socials: ContactSocialLinkData[];
  /** Latest article and next event for the Resources menu. */
  highlights?: ResourceHighlight[];
};

/**
 * Sticky site header. Royal on pages with a dark hero, cream elsewhere.
 * Desktop (1280px+) shows the full nav with mega-menus; below that, a
 * hamburger opens the full-screen menu, matching Superside's breakpoints.
 */
export function SiteHeader({
  whatsappHref,
  socials,
  highlights = [],
}: SiteHeaderProps) {
  const pathname = usePathname();
  const surface = headerSurfaceFor(pathname);
  const siteNav = useSiteNav();
  const { menus: MENUS, order: NAV_ORDER } = useMemo(
    () => buildNav(siteNav),
    [siteNav],
  );
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [focusPanel, setFocusPanel] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRefs = useRef<Record<MenuKey, HTMLButtonElement | null>>({
    services: null,
    catalogues: null,
    resources: null,
  });

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const close = useCallback(() => {
    cancelClose();
    setOpenMenu(null);
  }, []);

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenMenu(null), CLOSE_DELAY_MS);
  };

  const openNow = (key: MenuKey) => {
    cancelClose();
    setOpenMenu(key);
  };

  // Close on navigation.
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Escape closes and returns focus to the trigger.
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const key = openMenu;
        close();
        triggerRefs.current[key]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMenu, close]);

  useEffect(() => () => cancelClose(), []);

  // After a keyboard open, focus the first link in the panel.
  useEffect(() => {
    if (!focusPanel || !openMenu) return;
    const id = requestAnimationFrame(() => {
      document.querySelector<HTMLAnchorElement>(`#mega-${openMenu} a`)?.focus();
      setFocusPanel(false);
    });
    return () => cancelAnimationFrame(id);
  }, [focusPanel, openMenu]);

  const dark = surface === "royal";

  return (
    <>
      <header
        data-surface={surface}
        className="dx-site bg-surface text-surface-fg sticky top-0 z-[90]"
        onMouseLeave={scheduleClose}
        onMouseEnter={cancelClose}
      >
        <Container className="flex h-14 items-center justify-between gap-6 xl:h-[78px]">
          <Logo tone={dark ? "dark" : "light"} priority />

          {/* Desktop nav */}
          <nav
            aria-label="Main"
            className="hidden items-center gap-1 xl:flex 3xl:gap-2"
          >
            {NAV_ORDER.map((item) => {
              if ("link" in item) {
                const { link } = item;
                const active = isActivePath(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onMouseEnter={scheduleClose}
                    aria-current={active ? "page" : undefined}
                    className={navItemClass(active)}
                  >
                    <ActiveDot show={active} />
                    {link.label}
                  </Link>
                );
              }
              const menu = MENUS[item.menu];
              const expanded = openMenu === menu.key;
              const active = menu.bases.some((b) => isActivePath(pathname, b));
              return (
                <button
                  key={menu.key}
                  ref={(el) => {
                    triggerRefs.current[menu.key] = el;
                  }}
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`mega-${menu.key}`}
                  onMouseEnter={() => openNow(menu.key)}
                  onClick={(e) => {
                    if (expanded) return close();
                    openNow(menu.key);
                    // detail === 0 means keyboard (Enter/Space): move focus
                    // into the panel so its links come next in tab order.
                    if (e.detail === 0) setFocusPanel(true);
                  }}
                  className={navItemClass(active || expanded)}
                >
                  <ActiveDot show={active} />
                  {menu.label}
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "size-4 transition-transform duration-300",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              href={siteNav.cta.href}
              className="hidden xl:inline-flex"
              onMouseEnter={scheduleClose}
            >
              {siteNav.cta.label}
            </Button>
            <MobileMenu
              surface={surface}
              whatsappHref={whatsappHref}
              socials={socials}
            />
          </div>
        </Container>

        {/* Mega-menu panels (always light, like Superside) */}
        <AnimatePresence>
          {openMenu && (
            <motion.div
              key={openMenu}
              id={`mega-${openMenu}`}
              data-surface="canvas"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface text-surface-fg absolute inset-x-0 top-full hidden border-t border-black/5 shadow-[0_24px_48px_-24px_rgb(0_8_107/0.25)] xl:block"
            >
              <Container className="py-10">
                {openMenu === "services" ? (
                  <ServicesPanel onNavigate={close} />
                ) : openMenu === "catalogues" ? (
                  <CataloguesPanel onNavigate={close} />
                ) : (
                  <ResourcesPanel onNavigate={close} highlights={highlights} />
                )}
              </Container>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Blurred page behind an open mega-menu */}
      <AnimatePresence>
        {openMenu && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onMouseEnter={scheduleClose}
            onClick={close}
            className="fixed inset-0 z-[80] hidden bg-royal/15 backdrop-blur-md xl:block"
          />
        )}
      </AnimatePresence>
    </>
  );
}

function navItemClass(highlight: boolean) {
  return cn(
    "relative inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[0.9375rem] transition-colors",
    "hover:bg-surface-fg/8 focus-visible:outline-2 focus-visible:outline-surface-accent",
    highlight && "bg-surface-fg/8",
  );
}

function ActiveDot({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      aria-hidden
      className="bg-surface-accent mr-0.5 inline-block size-1.5 rounded-full"
    />
  );
}
