import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DynamicRegistrationForm } from "@/components/events/dynamic-registration-form";
import { RecaptchaProvider } from "@/components/layout/recaptcha-provider";
import {
  EventDetail,
  googleCalendarHref,
} from "@/components/site/events/event-detail";
import { SampleRegistrationForm } from "@/components/site/events/sample-registration-form";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { eventDateLabel, formatFor, getEvents } from "@/lib/site/events-data";
import { STOCK, stock } from "@/lib/site/stock-media";
import { formatDateInTimezone } from "@/lib/timezone";
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
      select: { title: true, description: true, imagePublicId: true },
    })
    .catch(() => null);

  if (!event) {
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

export default async function EventPage({ params }: Props) {
  const { slug } = await params;

  const event = await prisma.event
    .findUnique({
      where: { slug },
      include: { formFields: { orderBy: { position: "asc" } } },
    })
    .catch(() => null);

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
        ended={start.getTime() <= Date.now()}
        spacesLabel="Open to all"
        calendarHref={googleCalendarHref(
          sample.title,
          sample.description,
          sample.location,
          start,
        )}
        sample
        registration={<SampleRegistrationForm />}
      />
    );
  }

  if (event.status === "DRAFT") notFound();

  const acceptedCount = await prisma.eventRegistration.count({
    where: { eventId: event.id, status: "ACCEPTED" },
  });

  const isClosed = event.status === "CLOSED";
  const spotsLeft = event.attendeeLimit
    ? event.attendeeLimit - acceptedCount
    : null;
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
      ended={event.dateTime.getTime() <= Date.now()}
      spacesLabel={
        isClosed
          ? "Registration closed"
          : event.attendeeLimit
            ? spotsLeft !== null && spotsLeft > 0
              ? `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`
              : `${acceptedCount} / ${event.attendeeLimit} accepted`
            : "Open to all"
      }
      calendarHref={googleCalendarHref(
        event.title,
        event.description,
        event.location,
        event.dateTime,
      )}
      registration={
        <RecaptchaProvider>
          <DynamicRegistrationForm
            eventSlug={slug}
            fields={event.formFields.map((f) => ({
              name: f.name,
              label: f.label,
              type: f.type,
              placeholder: f.placeholder,
              required: f.required,
              options: f.options,
            }))}
            isClosed={isClosed}
            submitAction={boundRegister}
          />
        </RecaptchaProvider>
      }
    />
  );
}
