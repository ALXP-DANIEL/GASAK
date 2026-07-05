"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { userRole } from "@/lib/session";
import { actionUser, isSquadLeader } from "@/server/authz";
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

async function canManageSquadEvents(
  actorId: string,
  role: string,
  squadId: string | null,
) {
  if (role === "admin") return true;
  if (role !== "leader") return false;
  // leaders can only manage events for squads they lead — not org-wide ones
  if (!squadId) return false;
  return isSquadLeader(actorId, squadId);
}

export async function createEvent(
  input: z.infer<typeof eventSchema>,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "leader");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  if (
    !(await canManageSquadEvents(
      actor.id,
      userRole(actor),
      parsed.data.squadId,
    ))
  ) {
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

  await db.insert(events).values({
    title: parsed.data.title,
    description: parsed.data.description || null,
    type: parsed.data.type,
    startsAt,
    endsAt,
    location: parsed.data.location || null,
    squadId: parsed.data.squadId,
    createdBy: actor.id,
  });

  revalidatePath("/old/dashboard/calendar");
  revalidatePath("/old/dashboard");
  return { ok: true, message: "Event created" };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const actor = await actionUser("admin", "leader");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
  if (!event) return { ok: false, error: "Event not found" };

  if (!(await canManageSquadEvents(actor.id, userRole(actor), event.squadId))) {
    return { ok: false, error: "You cannot delete this event" };
  }

  await db.delete(events).where(eq(events.id, eventId));

  revalidatePath("/old/dashboard/calendar");
  revalidatePath("/old/dashboard");
  return { ok: true, message: "Event deleted" };
}
