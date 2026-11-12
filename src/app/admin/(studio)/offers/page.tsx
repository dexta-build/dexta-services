import prisma from "@/lib/prisma";
import { requirePageAccess } from "@/lib/admin/session";
import { OFFERS_PAGE_CONTENT } from "@/lib/content/pages/main";
import { loadPage } from "@/lib/content/store";
import { getWhatsAppHref } from "@/lib/site/page-context";
import { getRates } from "@/lib/site/rates";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { Button } from "@/components/site/button";
import { OffersManager, type AdminOffer } from "./offers-manager";

export const metadata = { title: "Offers" };

function parseFeatures(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default async function OffersAdminPage() {
  await requirePageAccess("offers");
  const [rows, rates, whatsappBase, page] = await Promise.all([
    prisma.offer
      .findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] })
      .catch(() => null),
    getRates(),
    getWhatsAppHref(),
    loadPage(OFFERS_PAGE_CONTENT),
  ]);

  const offers: AdminOffer[] | null = rows
    ? rows.map((o) => ({
        id: o.id,
        form: {
          name: o.name,
          description: o.description,
          features: parseFeatures(o.features),
          priceNGN: o.priceNGN,
          priceNote: o.priceNote ?? "",
          badge: o.badge ?? "",
          paymentLink: o.paymentLink ?? "",
          whatsappEnabled: o.whatsappEnabled,
          startsAt: o.startsAt?.toISOString() ?? null,
          endsAt: o.endsAt?.toISOString() ?? null,
          isHighlighted: o.isHighlighted,
          isVisible: o.isVisible,
        },
      }))
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Offers"
        title="Manage *offers*"
        description="Each offer's price, what's included, how people pay and when it runs. Drag to set the order on the Offers page."
        actions={
          <Button href="/admin/pages/offers" size="sm" variant="subtle" arrow>
            Offers page
          </Button>
        }
      />
      {offers ? (
        <OffersManager
          offers={offers}
          rates={rates}
          whatsappBase={whatsappBase}
          labels={page.data.cards}
          serverNow={Date.now()}
        />
      ) : (
        <Callout tone="danger" title="Offers couldn't be loaded">
          The database didn&apos;t answer. Refresh the page to try again.
        </Callout>
      )}
    </>
  );
}
