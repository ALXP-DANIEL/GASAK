"use server";

import { logActivity } from "@server/activity-log";
import { actionUser, canManageSquad } from "@server/authz";
import { db, scrims } from "@server/db";
import { userOrgRole } from "@server/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

const scrimSchema = z.object({
  squadId: z.uuid("Pick a squad"),
  opponent: z.string().min(1, "Opponent is required"),
  date: z.string().min(1, "Date is required"),
  result: z.string().optional(),
  notes: z.string().optional(),
  replayLink: z.union([z.url("Enter a valid URL"), z.literal("")]).optional(),
  // Optional link back to the schedule event this scrim was played at
  eventId: z.uuid().nullable().optional(),
});

export async function createScrim(
  input: z.infer<typeof scrimSchema>,
): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = scrimSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  if (
    !(await canManageSquad(actor.id, userOrgRole(actor), parsed.data.squadId))
  ) {
    return { ok: false, error: "You can only add records for your squad" };
  }

  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "Invalid date" };

  const [row] = await db
    .insert(scrims)
    .values({
      squadId: parsed.data.squadId,
      opponent: parsed.data.opponent,
      date,
      result: parsed.data.result || null,
      notes: parsed.data.notes || null,
      replayLink: parsed.data.replayLink || null,
      eventId: parsed.data.eventId ?? null,
    })
    .returning();
  await logActivity({
    actor,
    action: "create",
    entityType: "scrim",
    entityId: row.id,
    description: `Recorded scrim vs ${row.opponent}`,
  });

  revalidatePath("/dashboard/matches");
  if (row.eventId) {
    revalidatePath(`/dashboard/schedules/${row.eventId}`);
  }
  return { ok: true, message: "Scrim recorded" };
}

export async function deleteScrim(id: string): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const row = await db.query.scrims.findFirst({ where: eq(scrims.id, id) });
  if (!row) return { ok: false, error: "Record not found" };
  if (!(await canManageSquad(actor.id, userOrgRole(actor), row.squadId))) {
    return { ok: false, error: "You cannot delete this record" };
  }

  await db.delete(scrims).where(eq(scrims.id, id));
  await logActivity({
    actor,
    action: "delete",
    entityType: "scrim",
    entityId: row.id,
    description: `Deleted scrim vs ${row.opponent}`,
  });
  revalidatePath("/dashboard/matches");
  return { ok: true, message: "Scrim deleted" };
}
