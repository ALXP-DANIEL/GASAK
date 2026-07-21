"use server";

import { parseMYDateTimeLocal } from "@lib/format";
import { logActivity } from "@server/activity-log";
import { actionUser, canManageSquad } from "@server/authz";
import { db, events, eventTypeEnum, tournaments } from "@server/db";
import { userOrgRole } from "@server/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

/**
 * Keeps the auto-created `tournaments` row for a "tournament"-type schedule
 * entry in sync — create one on first save, update it on edits, or unlink
 * (never delete: it may already have rounds/results) if the type changes
 * away from "tournament". This is a lightweight link only; the auto-created
 * tournament still needs an admin to fill in format/rounds/Challonge if they
 * want full tracking.
 */
async function syncLinkedTournament(event: {
  id: string;
  title: string;
  date: string;
  prizePool: string | null;
  squadId: string | null;
  type: (typeof eventTypeEnum.enumValues)[number];
}) {
  const linked = await db.query.tournaments.findFirst({
    where: eq(tournaments.eventId, event.id),
  });

  if (event.type !== "tournament") {
    if (linked) {
      await db
        .update(tournaments)
        .set({ eventId: null })
        .where(eq(tournaments.id, linked.id));
    }
    return;
  }

  const values = {
    name: event.title,
    date: parseMYDateTimeLocal(`${event.date}T00:00`),
    prizePool: event.prizePool || "TBD",
    squadId: event.squadId,
  };

  if (linked) {
    await db.update(tournaments).set(values).where(eq(tournaments.id, linked.id));
  } else {
    await db.insert(tournaments).values({ ...values, eventId: event.id });
  }
}

const eventSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  type: z.enum(eventTypeEnum.enumValues),
  date: z.string().min(1, "Date is required"),
  prizePool: z.string().optional(),
  location: z.string().optional(),
  squadId: z.uuid().nullable(),
});

export async function createEvent(
  input: z.infer<typeof eventSchema>,
): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  if (
    !(await canManageSquad(actor.id, userOrgRole(actor), parsed.data.squadId))
  ) {
    return { ok: false, error: "You can only create events for your squad" };
  }

  const [row] = await db
    .insert(events)
    .values({
      title: parsed.data.title,
      description: parsed.data.description || null,
      type: parsed.data.type,
      date: parsed.data.date,
      prizePool:
        parsed.data.type === "tournament"
          ? parsed.data.prizePool || null
          : null,
      location: parsed.data.location || null,
      squadId: parsed.data.squadId,
      createdBy: actor.id,
    })
    .returning();
  await syncLinkedTournament(row);
  await logActivity({
    actor,
    action: "create",
    entityType: "event",
    entityId: row.id,
    description: `Created ${row.type} event "${row.title}"`,
  });

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tournaments");
  return { ok: true, message: "Event created" };
}

export async function updateEvent(
  eventId: string,
  input: z.infer<typeof eventSchema>,
): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const existing = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
  if (!existing) return { ok: false, error: "Event not found" };
  if (!(await canManageSquad(actor.id, userOrgRole(actor), existing.squadId))) {
    return { ok: false, error: "You cannot edit this event" };
  }

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  if (
    !(await canManageSquad(actor.id, userOrgRole(actor), parsed.data.squadId))
  ) {
    return { ok: false, error: "You can only assign your own squad" };
  }

  await db
    .update(events)
    .set({
      title: parsed.data.title,
      description: parsed.data.description || null,
      type: parsed.data.type,
      date: parsed.data.date,
      prizePool:
        parsed.data.type === "tournament"
          ? parsed.data.prizePool || null
          : null,
      location: parsed.data.location || null,
      squadId: parsed.data.squadId,
    })
    .where(eq(events.id, eventId));

  await syncLinkedTournament({
    id: eventId,
    title: parsed.data.title,
    date: parsed.data.date,
    prizePool: parsed.data.type === "tournament" ? parsed.data.prizePool || null : null,
    squadId: parsed.data.squadId,
    type: parsed.data.type,
  });

  await logActivity({
    actor,
    action: "update",
    entityType: "event",
    entityId: eventId,
    description: `Updated ${parsed.data.type} event "${parsed.data.title}"`,
  });

  revalidatePath("/dashboard/schedules");
  revalidatePath(`/dashboard/schedules/${eventId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tournaments");
  return { ok: true, message: "Event updated" };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
  if (!event) return { ok: false, error: "Event not found" };

  if (!(await canManageSquad(actor.id, userOrgRole(actor), event.squadId))) {
    return { ok: false, error: "You cannot delete this event" };
  }

  await db.delete(events).where(eq(events.id, eventId));
  await logActivity({
    actor,
    action: "delete",
    entityType: "event",
    entityId: event.id,
    description: `Deleted event "${event.title}"`,
  });

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
  return { ok: true, message: "Event deleted" };
}
