"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { userRole } from "@/lib/session";
import { logActivity } from "@/server/activity-log";
import { actionUser, canManageSquad } from "@/server/authz";
import { db, events, eventTypeEnum } from "@/server/db";
import type { ActionResult } from "./public";

const eventSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  type: z.enum(eventTypeEnum.enumValues),
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().optional(),
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

  if (!(await canManageSquad(actor.id, userRole(actor), parsed.data.squadId))) {
    return { ok: false, error: "You can only create events for your squad" };
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, error: "Invalid start time" };
  }
  if (endsAt && endsAt <= startsAt) {
    return { ok: false, error: "End time must be after the start time" };
  }

  const [row] = await db
    .insert(events)
    .values({
      title: parsed.data.title,
      description: parsed.data.description || null,
      type: parsed.data.type,
      startsAt,
      endsAt,
      location: parsed.data.location || null,
      squadId: parsed.data.squadId,
      createdBy: actor.id,
    })
    .returning();
  await logActivity({
    actor,
    action: "create",
    entityType: "event",
    entityId: row.id,
    description: `Created ${row.type} event "${row.title}"`,
  });

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
  return { ok: true, message: "Event created" };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
  if (!event) return { ok: false, error: "Event not found" };

  if (!(await canManageSquad(actor.id, userRole(actor), event.squadId))) {
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
