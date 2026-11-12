"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Accordion, Dialog } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContactSocialLinkData } from "@/lib/contact-defaults";
import { CONTACT_SOCIAL_PLATFORM_META } from "@/lib/contact-socials";
import { asIcon, pillFor, useSiteNav } from "./nav-context";
import { Button } from "../button";
import { Logo } from "./logo";
import { GroupPill, MenuRow } from "./mega-menu";

type MobileMenuProps = {
  surface: "royal" | "canvas";
  whatsappHref: string | null;
  socials: ContactSocialLinkData[];
};

/**
 * Full-screen menu for screens below 1280px: a cream sheet with expandable
 * Services, Catalogues and Resources sections, plain links, and pinned CTAs.
 */
export function MobileMenu({
  surface,
  whatsappHref,
  socials,
}: MobileMenuProps) {
  const nav = useSiteNav();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const visibleSocials = socials
    .filter((s) => s.isVisible && s.href)
    .sort((a, b) => a.position - b.position);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Open menu"
        className="text-surface-fg -mr-2 inline-flex size-11 items-center justify-center xl:hidden"
      >
        <HamburgerIcon accent={surface === "royal"} />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Content
          data-surface="canvas"
          aria-describedby={undefined}
          className="dx-site bg-surface text-surface-fg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-[120] flex flex-col outline-none xl:hidden"
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>

          {/* Top bar mirrors the header so the logo and toggle stay put */}
          <div
            data-surface={surface}
            className="bg-surface text-surface-fg flex h-14 shrink-0 items-center justify-between px-4 md:px-8"
          >
            <Logo
              tone={surface === "royal" ? "dark" : "light"}
              onClick={close}
            />
            <Dialog.Close
              aria-label="Close menu"
              className="-mr-2 inline-flex size-11 items-center justify-center"
            >
              <CloseIcon accent={surface === "royal"} />
            </Dialog.Close>
          </div>

          <nav
            aria-label="Main"
            className="flex w-full flex-1 flex-col overflow-y-auto dx-no-scrollbar px-4 pt-4 pb-6 md:px-8"
          >
            <Accordion.Root type="single" collapsible>
              <MenuSection value="services" label={nav.labels.services}>
                <div className="flex flex-col gap-6 pb-4">
                  {nav.serviceGroups.map((group, gi) => (
                    <div
                      key={group.key ?? group.href}
                      className="flex flex-col gap-2"
                    >
                      <GroupPill
                        group={{ ...group, pillClass: pillFor(group, gi) }}
                        onNavigate={close}
                        className="self-start text-xl"
                      />
                      <div className="flex flex-col">
                        {group.items.map((item) => (
                          <MenuRow
                            key={item.href}
                            {...item}
                            onNavigate={close}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </MenuSection>

              <MenuSection value="catalogues" label={nav.labels.catalogues}>
                <div className="flex flex-col pb-4">
                  {nav.catalogues.map((c) => (
                    <MenuRow
                      key={c.slug}
                      href={c.href}
                      title={c.title}
                      description={c.description}
                      icon={asIcon(c.icon)}
                      onNavigate={close}
                    />
                  ))}
                  <Link
                    href="/catalogue"
                    onClick={close}
                    className="dx-link mt-3 self-start text-sm font-bold"
                  >
                    {nav.labels.cataloguesAll ?? "Browse all catalogues"}
                  </Link>
                </div>
              </MenuSection>

              <MenuSection value="resources" label={nav.labels.resources}>
                <div className="flex flex-col pb-4">
                  {nav.resources.map((r) => (
                    <MenuRow
                      key={r.href}
                      href={r.href}
                      title={r.title}
                      description={r.description}
                      icon={r.icon}
                      onNavigate={close}
                    />
                  ))}
                </div>
              </MenuSection>
            </Accordion.Root>

            {nav.mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                aria-current={pathname === link.href ? "page" : undefined}
                className="border-surface-rule flex items-center border-b py-4 text-lg font-bold"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-8 flex flex-col gap-3">
              <Button href={nav.cta.href} block size="lg" onClick={close}>
                {nav.cta.label}
              </Button>
              {whatsappHref && (
                <Button
                  href={whatsappHref}
                  external
                  variant="outline"
                  block
                  size="lg"
                >
                  Chat on WhatsApp
                </Button>
              )}
            </div>

            {visibleSocials.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {visibleSocials.map((s) => {
                  const meta = CONTACT_SOCIAL_PLATFORM_META[s.platform];
                  const Icon = meta.icon;
                  return (
                    <a
                      key={`${s.platform}-${s.href}`}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label || meta.label}
                      className="border-surface-fg/30 hover:bg-surface-fg hover:text-surface inline-flex size-11 items-center justify-center rounded-full border transition-colors"
                    >
                      <Icon className="size-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MenuSection({
  value,
  label,
  children,
}: {
  value: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Accordion.Item value={value} className="border-surface-rule border-b">
      <Accordion.Header>
        <Accordion.Trigger className="group/sec flex w-full items-center justify-between py-4 text-left text-lg font-bold">
          {label}
          <ChevronDown
            aria-hidden
            className="size-5 transition-transform duration-300 group-data-[state=open]/sec:rotate-180"
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
        {children}
      </Accordion.Content>
    </Accordion.Item>
  );
}

/** Two-line hamburger, cyan on the royal header like Superside's lime. */
function HamburgerIcon({ accent }: { accent: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex w-6 flex-col gap-[7px]",
        accent ? "text-brand-cyan" : "text-surface-fg",
      )}
    >
      <span className="block h-0.5 w-full rounded-full bg-current" />
      <span className="block h-0.5 w-full rounded-full bg-current" />
    </span>
  );
}

function CloseIcon({ accent }: { accent: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative block size-6",
        accent ? "text-brand-cyan" : "text-surface-fg",
      )}
    >
      <span className="absolute top-1/2 left-0 block h-0.5 w-full rotate-45 rounded-full bg-current" />
      <span className="absolute top-1/2 left-0 block h-0.5 w-full -rotate-45 rounded-full bg-current" />
    </span>
  );
}
