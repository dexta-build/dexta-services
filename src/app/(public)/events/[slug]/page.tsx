import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { RecaptchaProvider } from "@/components/layout/recaptcha-provider";
import {
  EventDetail,
  googleCalendarHref,
} from "@/components/site/events/event-detail";
import { RegistrationForm } from "@/components/site/events/registration-form";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import { EVENT_TEMPLATE } from "@/lib/content/pages/templates";
import { loadPage } from "@/lib/content/store";
import { parseOptions, type FieldType } from "@/lib/events/fields";
import prisma from "@/lib/prisma";
import { eventDateLabel, formatFor, getEvents } from "@/lib/site/events-data";
import { STOCK, stock } from "@/lib/site/stock-media";
import { formatDateInTimezone } from "@/lib/timezone";
import { eventPriceLabel } from "@/lib/events/price";
import { registerForEvent } from "./actions";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Development-only sample event with this slug, if any. */
async function findSample(slug: string) {
  if (process.env.NODE_ENV === "production") return undefined;
  return (await getEvents()).find((e) => e.sample && e.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event
    .findUnique({
      where: { slug },
      select: {
        title: true,
        description: true,
        imagePublicId: true,
        status: true,
      },
    })
    .catch(() => null);

  if (!event || event.status === "DRAFT") {
    const sample = await findSample(slug);
    return sample
      ? {
          alternates: { canonical: `/events/${slug}` },
          title: sample.title,
          description: sample.description.slice(0, 160),
        }
      : {};
  }

  const ogImage = event.imagePublicId
    ? getCloudinaryUrl(event.imagePublicId, {
        w: 1200,
        h: 630,
        c: "fill",
        f: "auto",
        q: "auto",
      })
    : undefined;

  return {
    alternates: { canonical: `/events/${slug}` },
    title: event.title,
    description: event.description.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 160),
      ...(ogImage
        ? { images: [{ url: ogImage, width: 1200, height: 630 }] }
        : {}),
    },
  };
}

const SAMPLE_FIELDS = [
  {
    name: "phone",
    label: "Phone / WhatsApp",
    type: "TEXT" as const,
    placeholder: "+234…",
    required: true,
    options: [],
  },
];

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const [event, template] = await Promise.all([
    prisma.event
      .findUnique({
        where: { slug },
        include: { formFields: { orderBy: { position: "asc" } } },
      })
      .catch(() => null),
    loadPage(EVENT_TEMPLATE),
  ]);
  const { labels: L, form: formLabels } = template.data;

  // An old address forwards to the event's current one.
  if (!event) {
    const moved = await prisma.eventSlugRedirect
      .findUnique({
        where: { slug },
        select: { event: { select: { slug: true, status: true } } },
      })
      .catch(() => null);
    if (moved && moved.event.status !== "DRAFT")
      permanentRedirect(`/events/${moved.event.slug}`);
  }

  // Sample events (development only) get the same page with a preview form.
  if (!event) {
    const sample = await findSample(slug);
    if (!sample) notFound();
    const start = new Date(sample.dateTime);
    return (
      <EventDetail
        title={sample.title}
        description={sample.description}
        dateLabel={eventDateLabel(sample)}
        location={sample.location}
        format={sample.format}
        image={sample.image ?? stock(STOCK.eventStage, 2000, 1200)}
        price={sample.price}
        ended={start.getTime() <= Date.now()}
        spacesLabel={L.openToAll}
        calendarHref={googleCalendarHref(
          sample.title,
          sample.description,
          sample.location,
          start,
        )}
        sample
        labels={L}
        registration={
          <RegistrationForm
            fields={SAMPLE_FIELDS}
            labels={{
              ...formLabels,
              subtitle: "Sample event: nothing is sent.",
            }}
            preview
          />
        }
      />
    );
  }

  if (event.status === "DRAFT") notFound();

  const acceptedCount = await prisma.eventRegistration.count({
    where: { eventId: event.id, status: "ACCEPTED" },
  });

  const spotsLeft = event.attendeeLimit
    ? Math.max(0, event.attendeeLimit - acceptedCount)
    : null;
  const isClosed = event.status === "CLOSED" || spotsLeft === 0;
  const image = event.imagePublicId
    ? getCloudinaryUrl(event.imagePublicId, { w: 2000, f: "auto", q: "auto" })
    : stock(STOCK.eventStage, 2000, 1200);

  const boundRegister = async (formData: Record<string, string>) => {
    "use server";
    return registerForEvent(slug, formData);
  };

  return (
    <EventDetail
      title={event.title}
      description={event.description}
      dateLabel={formatDateInTimezone(event.dateTime, event.timezone)}
      location={event.location}
      format={formatFor(event.location)}
      image={image}
      price={eventPriceLabel(event.isPaid, event.priceNGN)}
      priceNote={event.priceNote ?? undefined}
      paymentLink={
        event.isPaid && event.paymentLink ? event.paymentLink : undefined
      }
      ended={event.dateTime.getTime() <= Date.now()}
      labels={L}
      spacesLabel={
        event.status === "CLOSED"
          ? L.closed
          : spotsLeft === null
            ? L.openToAll
            : spotsLeft === 0
              ? L.full
              : spotsLeft === 1
                ? L.spotsLeftOne
                : L.spotsLeftMany.replace("{count}", String(spotsLeft))
      }
      calendarHref={googleCalendarHref(
        event.title,
        event.description,
        event.location,
        event.dateTime,
      )}
      registration={
        <RecaptchaProvider>
          <RegistrationForm
            fields={event.formFields.map((f) => ({
              name: f.name,
              label: f.label,
              type: f.type as FieldType,
              placeholder: f.placeholder ?? "",
              required: f.required,
              options: parseOptions(f.options),
            }))}
            closed={isClosed}
            submitAction={boundRegister}
            labels={formLabels}
            payment={
              event.isPaid && event.paymentLink
                ? {
                    price: eventPriceLabel(event.isPaid, event.priceNGN),
                    link: event.paymentLink,
                  }
                : undefined
            }
          />
        </RecaptchaProvider>
      }
    />
  );
}
