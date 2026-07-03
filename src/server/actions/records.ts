"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { userRole } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";
import { actionUser, isSquadLeader } from "@/server/authz";
import { db, scrims, tournaments } from "@/server/db";
import type { ActionResult } from "./public";

async function canManageSquad(
  actorId: string,
  role: string,
  squadId: string | null,
) {
  if (role === "admin") return true;
  if (role !== "leader" || !squadId) return false;
  return isSquadLeader(actorId, squadId);
}

const tournamentSchema = z.object({
  name: z.string().min(2, "Tournament name is required"),
  organizer: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  prize: z.string().optional(),
  opponent: z.string().optional(),
  result: z.string().optional(),
  mvp: z.string().optional(),
  squadId: z.uuid("Pick a squad"),
});

export async function createTournament(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "leader");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = tournamentSchema.safeParse({
    name: formData.get("name"),
    organizer: formData.get("organizer") || undefined,
    date: formData.get("date"),
    prize: formData.get("prize") || undefined,
    opponent: formData.get("opponent") || undefined,
    result: formData.get("result") || undefined,
    mvp: formData.get("mvp") || undefined,
    squadId: formData.get("squadId"),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  if (!(await canManageSquad(actor.id, userRole(actor), parsed.data.squadId))) {
    return { ok: false, error: "You can only add records for your squad" };
  }

  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "Invalid date" };

  let screenshotUrl: string | null = null;
  const screenshot = formData.get("screenshot");
  if (screenshot instanceof File && screenshot.size > 0) {
    try {
      screenshotUrl = await saveUpload(screenshot, "tournaments");
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  await db.insert(tournaments).values({
    name: parsed.data.name,
    organizer: parsed.data.organizer ?? null,
    date,
    prize: parsed.data.prize ?? null,
    opponent: parsed.data.opponent ?? null,
    result: parsed.data.result ?? null,
    mvp: parsed.data.mvp ?? null,
    screenshotUrl,
    squadId: parsed.data.squadId,
  });

  revalidatePath("/dashboard/tournaments");
  return { ok: true, message: "Tournament recorded" };
}

export async function deleteTournament(id: string): Promise<ActionResult> {
  const actor = await actionUser("admin", "leader");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const row = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, id),
  });
  if (!row) return { ok: false, error: "Record not found" };
  if (!(await canManageSquad(actor.id, userRole(actor), row.squadId))) {
    return { ok: false, error: "You cannot delete this record" };
  }

  await db.delete(tournaments).where(eq(tournaments.id, id));
  revalidatePath("/dashboard/tournaments");
  return { ok: true, message: "Tournament deleted" };
}

const scrimSchema = z.object({
  squadId: z.uuid("Pick a squad"),
  opponent: z.string().min(1, "Opponent is required"),
  date: z.string().min(1, "Date is required"),
  result: z.string().optional(),
  notes: z.string().optional(),
  replayLink: z.union([z.url("Enter a valid URL"), z.literal("")]).optional(),
});

export async function createScrim(
  input: z.infer<typeof scrimSchema>,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "leader");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = scrimSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  if (!(await canManageSquad(actor.id, userRole(actor), parsed.data.squadId))) {
    return { ok: false, error: "You can only add records for your squad" };
  }

  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "Invalid date" };

  await db.insert(scrims).values({
    squadId: parsed.data.squadId,
    opponent: parsed.data.opponent,
    date,
    result: parsed.data.result || null,
    notes: parsed.data.notes || null,
    replayLink: parsed.data.replayLink || null,
  });

  revalidatePath("/dashboard/scrims");
  return { ok: true, message: "Scrim recorded" };
}

export async function deleteScrim(id: string): Promise<ActionResult> {
  const actor = await actionUser("admin", "leader");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const row = await db.query.scrims.findFirst({ where: eq(scrims.id, id) });
  if (!row) return { ok: false, error: "Record not found" };
  if (!(await canManageSquad(actor.id, userRole(actor), row.squadId))) {
    return { ok: false, error: "You cannot delete this record" };
  }

  await db.delete(scrims).where(eq(scrims.id, id));
  revalidatePath("/dashboard/scrims");
  return { ok: true, message: "Scrim deleted" };
}
