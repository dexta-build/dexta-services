"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getCloudinaryPublicId } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { eventFormSchema, type EventFormData } from "@/lib/validators";
import {
  sendAcceptanceEmail,
  sendDeclineEmail,
  sendEventFullEmail,
} from "@/lib/email";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

function normalizeCloudinaryValue(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return "";
  }

  return getCloudinaryPublicId(trimmedValue) ?? trimmedValue;
}

function normalizeEventImage(data: Omit<EventFormData, "formFields" | "slug">) {
  return {
    ...data,
    imagePublicId: normalizeCloudinaryValue(data.imagePublicId),
  };
}

// ─── Create Event ────────────────────────────────────────────────────────────

export async function createEvent(
  data: EventFormData,
): Promise<{ success: boolean; message: string; eventId?: string }> {
  try {
    await requireAuth();

    const parsed = eventFormSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const { formFields, slug, ...eventData } = parsed.data;
    const normalizedEventData = normalizeEventImage(eventData);

    // Check slug uniqueness
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (existing) {
      return {
        success: false,
        message: "This slug is already in use. Please choose a different one.",
      };
    }

    const event = await prisma.event.create({
      data: {
        ...normalizedEventData,
        slug,
        dateTime: new Date(normalizedEventData.dateTime),
        formFields: {
          create: formFields.map((field, i) => ({
            name: field.name,
            label: field.label,
            type: field.type,
            placeholder: field.placeholder || null,
            required: field.required,
            options: field.options || null,
            position: i,
          })),
        },
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    return {
      success: true,
      message: "Event created successfully",
      eventId: event.id,
    };
  } catch (error) {
    console.error("[Create Event]", error);
    return { success: false, message: "Failed to create event" };
  }
}

// ─── Update Event ────────────────────────────────────────────────────────────

export async function updateEvent(
  id: string,
  data: EventFormData,
): Promise<{ success: boolean; message: string; eventId?: string }> {
  try {
    await requireAuth();

    const parsed = eventFormSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const { formFields, slug, ...eventData } = parsed.data;
    const normalizedEventData = normalizeEventImage(eventData);

    // Check slug uniqueness (exclude current event)
    const slugConflict = await prisma.event.findFirst({
      where: { slug, id: { not: id } },
    });
    if (slugConflict) {
      return {
        success: false,
        message: "This slug is already in use. Please choose a different one.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: {
          ...normalizedEventData,
          slug,
          dateTime: new Date(normalizedEventData.dateTime),
        },
      });

      // Delete existing fields and recreate
      await tx.eventFormField.deleteMany({ where: { eventId: id } });

      if (formFields.length > 0) {
        await tx.eventFormField.createMany({
          data: formFields.map((field, i) => ({
            eventId: id,
            name: field.name,
            label: field.label,
            type: field.type,
            placeholder: field.placeholder || null,
            required: field.required,
            options: field.options || null,
            position: i,
          })),
        });
      }
    });

    revalidatePath(`/admin/events/${id}`);
    revalidatePath("/admin/events");
    revalidatePath("/events");
    return {
      success: true,
      message: "Event updated successfully",
      eventId: id,
    };
  } catch (error) {
    console.error("[Update Event]", error);
    return { success: false, message: "Failed to update event" };
  }
}

// ─── Update Event Status ─────────────────────────────────────────────────────

export async function updateEventStatus(
  id: string,
  status: "DRAFT" | "PUBLISHED" | "CLOSED",
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAuth();

    await prisma.event.update({
      where: { id },
      data: { status },
    });

    revalidatePath(`/admin/events/${id}`);
    revalidatePath("/admin/events");
    revalidatePath("/events");
    return {
      success: true,
      message: `Event ${status.toLowerCase()} successfully`,
    };
  } catch (error) {
    console.error("[Update Event Status]", error);
    return { success: false, message: "Failed to update event status" };
  }
}

// ─── Delete Event ────────────────────────────────────────────────────────────

export async function deleteEvent(
  id: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAuth();

    await prisma.event.delete({ where: { id } });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { success: true, message: "Event deleted successfully" };
  } catch (error) {
    console.error("[Delete Event]", error);
    return { success: false, message: "Failed to delete event" };
  }
}

export async function deleteEvents(
  ids: string[],
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAuth();

    if (!ids.length) {
      return { success: false, message: "No events selected." };
    }

    await prisma.event.deleteMany({
      where: { id: { in: ids } },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    return {
      success: true,
      message: `Deleted ${ids.length} event${ids.length === 1 ? "" : "s"} successfully`,
    };
  } catch (error) {
    console.error("[Bulk Delete Events]", error);
    return { success: false, message: "Failed to delete events" };
  }
}

// ─── Accept Registration ─────────────────────────────────────────────────────

export async function acceptRegistration(
  registrationId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAuth();

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration)
      return { success: false, message: "Registration not found" };
    if (registration.status !== "PENDING") {
      return { success: false, message: "Registration is not pending" };
    }
    if (registration.event.status !== "PUBLISHED") {
      return { success: false, message: "Event is not published" };
    }

    let autoDeclinedRegistrations: { name: string; email: string }[] = [];

    await prisma.$transaction(async (tx) => {
      // Accept the registration
      await tx.eventRegistration.update({
        where: { id: registrationId },
        data: { status: "ACCEPTED" },
      });

      // Check if we've hit the limit
      if (registration.event.attendeeLimit) {
        const acceptedCount = await tx.eventRegistration.count({
          where: { eventId: registration.eventId, status: "ACCEPTED" },
        });

        if (acceptedCount >= registration.event.attendeeLimit) {
          // Get remaining pending registrations
          const pending = await tx.eventRegistration.findMany({
            where: { eventId: registration.eventId, status: "PENDING" },
            select: { id: true, name: true, email: true },
          });

          if (pending.length > 0) {
            await tx.eventRegistration.updateMany({
              where: {
                eventId: registration.eventId,
                status: "PENDING",
              },
              data: {
                status: "DECLINED",
                declineReason: "Event capacity reached",
              },
            });

            autoDeclinedRegistrations = pending.map((p) => ({
              name: p.name,
              email: p.email,
            }));
          }

          // Close the event
          await tx.event.update({
            where: { id: registration.eventId },
            data: { status: "CLOSED" },
          });
        }
      }
    });

    // Send emails outside transaction (non-blocking)
    const eventInfo = {
      title: registration.event.title,
      dateTime: registration.event.dateTime,
      timezone: registration.event.timezone,
      location: registration.event.location,
    };

    let emailFailed = false;

    try {
      await sendAcceptanceEmail(
        { name: registration.name, email: registration.email },
        eventInfo,
      );
    } catch (err) {
      emailFailed = true;
      console.error(`[Accept] Email failed for ${registration.email}`, err);
    }

    if (autoDeclinedRegistrations.length > 0) {
      try {
        await sendEventFullEmail(autoDeclinedRegistrations, eventInfo);
      } catch (err) {
        console.error("[Accept] Event full emails failed", err);
      }
    }

    revalidatePath(`/admin/events/${registration.eventId}`);
    revalidatePath("/events");

    let message = "Registration accepted";
    if (autoDeclinedRegistrations.length > 0) {
      message = `Accepted. Event is now full — ${autoDeclinedRegistrations.length} pending registration(s) were auto-declined.`;
    }
    if (emailFailed) {
      message += " (Note: confirmation email failed to send)";
    }

    return { success: true, message };
  } catch (error) {
    console.error("[Accept Registration]", error);
    return { success: false, message: "Failed to accept registration" };
  }
}

// ─── Decline Registration ────────────────────────────────────────────────────

export async function declineRegistration(
  registrationId: string,
  reason?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAuth();

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration)
      return { success: false, message: "Registration not found" };
    if (registration.status !== "PENDING") {
      return { success: false, message: "Registration is not pending" };
    }

    await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { status: "DECLINED", declineReason: reason || null },
    });

    let emailFailed = false;
    try {
      await sendDeclineEmail(
        { name: registration.name, email: registration.email },
        {
          title: registration.event.title,
          dateTime: registration.event.dateTime,
          timezone: registration.event.timezone,
          location: registration.event.location,
        },
        reason,
      );
    } catch (err) {
      emailFailed = true;
      console.error(`[Decline] Email failed for ${registration.email}`, err);
    }

    revalidatePath(`/admin/events/${registration.eventId}`);
    revalidatePath("/events");
    return {
      success: true,
      message: emailFailed
        ? "Registration declined (Note: notification email failed to send)"
        : "Registration declined",
    };
  } catch (error) {
    console.error("[Decline Registration]", error);
    return { success: false, message: "Failed to decline registration" };
  }
}

// ─── Delete Registration ────────────────────────────────────────────────────

export async function deleteRegistration(
  registrationId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAuth();

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      select: { eventId: true },
    });

    if (!registration)
      return { success: false, message: "Registration not found" };

    await prisma.eventRegistration.delete({
      where: { id: registrationId },
    });

    revalidatePath(`/admin/events/${registration.eventId}`);
    revalidatePath("/admin/registrations");
    return { success: true, message: "Registration deleted" };
  } catch (error) {
    console.error("[Delete Registration]", error);
    return { success: false, message: "Failed to delete registration" };
  }
}

export async function deleteRegistrations(
  ids: string[],
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAuth();

    if (!ids.length) {
      return { success: false, message: "No registrations selected." };
    }

    await prisma.eventRegistration.deleteMany({
      where: { id: { in: ids } },
    });

    revalidatePath("/admin/registrations");
    revalidatePath("/admin/events");
    return {
      success: true,
      message: `Deleted ${ids.length} registration${ids.length === 1 ? "" : "s"} successfully`,
    };
  } catch (error) {
    console.error("[Bulk Delete Registrations]", error);
    return { success: false, message: "Failed to delete registrations" };
  }
}
