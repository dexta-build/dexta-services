import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type {
  ContactPageContentData,
  ContactSocialLinkData,
} from "@/lib/contact-defaults";
import { CONTACT_SOCIAL_PLATFORM_META } from "@/lib/contact-socials";
import { DEFAULT_NAV, type SiteNav } from "./nav-data";

export type FooterContent = {
  blurb: string;
  whatsappLabel: string;
  cataloguesTitle: string;
  companyTitle: string;
  companyLinks: { label: string; href: string }[];
  copyright: string;
};

const DEFAULT_FOOTER: FooterContent = {
  blurb:
    "A creative agency for design, software and print, helping brands and life's big moments look their best.",
  whatsappLabel: "Chat on WhatsApp",
  cataloguesTitle: "Catalogues",
  companyTitle: "Company",
  companyLinks: [],
  copyright: "© {year} Dexta Synergy Services. All rights reserved.",
};
import { Container } from "../container";
import { Logo } from "./logo";
import { BackToTop } from "./back-to-top";

type SiteFooterProps = {
  contact: Pick<ContactPageContentData, "address" | "emails" | "phones">;
  socials: ContactSocialLinkData[];
  /** Header menus (the service columns follow them). */
  nav?: SiteNav;
  /** Footer text and company links from Site settings. */
  footer?: FooterContent;
  whatsappHref: string | null;
};

/** Big dark footer: brand + contact, link columns, socials, giant wordmark. */
export function SiteFooter({
  contact,
  socials,
  nav = DEFAULT_NAV,
  footer = DEFAULT_FOOTER,
  whatsappHref,
}: SiteFooterProps) {
  const visibleSocials = socials
    .filter((s) => s.isVisible && s.href)
    .sort((a, b) => a.position - b.position);
  const email = contact.emails[0];
  const phone = contact.phones[0];

  return (
    <footer
      data-surface="royal"
      className="dx-site bg-surface text-surface-fg relative overflow-hidden"
    >
      <Container className="pt-16 md:pt-20 xl:pt-24">
        {/* Columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 pb-12 md:grid-cols-5 xl:grid-cols-[1.5fr_repeat(5,1fr)] xl:gap-x-8 xl:pb-16">
          <div className="col-span-2 flex flex-col gap-6 md:col-span-5 xl:col-span-1">
            <Logo tone="dark" />
            <p className="text-surface-muted max-w-xs text-sm leading-relaxed">
              {footer.blurb}
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="dx-link">
                    {email}
                  </a>
                </li>
              )}
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="dx-link"
                  >
                    {phone}
                  </a>
                </li>
              )}
              {whatsappHref && (
                <li>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dx-link"
                  >
                    {footer.whatsappLabel}
                  </a>
                </li>
              )}
              {contact.address && (
                <li className="text-surface-muted max-w-xs">
                  {contact.address}
                </li>
              )}
            </ul>
          </div>

          {nav.serviceGroups.slice(0, 3).map((group) => (
            <FooterColumn
              key={group.key ?? group.href}
              title={group.title}
              href={group.href}
            >
              {group.items.slice(0, 5).map((item) => (
                <FooterLink key={item.href} href={item.href}>
                  {item.title}
                </FooterLink>
              ))}
            </FooterColumn>
          ))}

          <FooterColumn title={footer.cataloguesTitle} href="/catalogue">
            {nav.catalogues.map((c) => (
              <FooterLink key={c.slug} href={c.href}>
                {c.title}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title={footer.companyTitle}>
            {footer.companyLinks.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        {/* Bottom bar */}
        <div className="border-surface-rule flex flex-col gap-6 border-t py-8 md:flex-row md:items-center md:justify-between">
          <p className="text-surface-muted text-sm">
            {footer.copyright.replace(
              "{year}",
              String(new Date().getFullYear()),
            )}
          </p>
          <div className="flex items-center gap-2">
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
                  className="border-surface-fg/30 hover:bg-brand-cyan hover:border-brand-cyan hover:text-royal inline-flex size-11 items-center justify-center rounded-full border transition-colors"
                >
                  <Icon className="size-4" />
                </a>
              );
            })}
            <BackToTop />
          </div>
        </div>
      </Container>

      {/* Giant wordmark: decorative, bleeds off the bottom edge */}
      <div aria-hidden className="pointer-events-none select-none">
        <Image
          src="/images/dexta1.png"
          alt=""
          width={3250}
          height={1021}
          sizes="100vw"
          className="mx-auto -mb-[4%] w-[92%] max-w-[110rem] opacity-[0.07]"
        />
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {href ? (
        <Link
          href={href}
          className="group/fc inline-flex items-center gap-1 text-[0.9375rem] font-bold"
        >
          {title}
          <ArrowUpRight
            aria-hidden
            className="size-4 transition-transform group-hover/fc:translate-x-0.5 group-hover/fc:-translate-y-0.5"
          />
        </Link>
      ) : (
        <p className="text-[0.9375rem] font-bold">{title}</p>
      )}
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-surface-muted hover:text-surface-fg dx-link text-sm transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
