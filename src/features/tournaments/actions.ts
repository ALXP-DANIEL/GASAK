"use server";

import { userRole } from "@lib/session";
import { actionUser, canManageSquad } from "@server/authz";
import { db, tournaments } from "@server/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { tournamentSchema } from "./schema";
import type { TournamentActionResult, TournamentInput } from "./types";

function parseInput(input: TournamentInput) {
  const parsed = tournamentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message } as const;
  }
  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) {
    return { error: "Invalid date" } as const;
  }
  return { data: parsed.data, date } as const;
}

function revalidateTournaments() {
  revalidatePath("/dashboard/tournaments");
  revalidatePath("/dashboard");
}

export async function createTournament(
  input: TournamentInput,
): Promise<TournamentActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = parseInput(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  if (!(await canManageSquad(actor.id, userRole(actor), parsed.data.squadId))) {
    return { ok: false, error: "You can only add records for your squad" };
  }

  await db.insert(tournaments).values({
    name: parsed.data.name,
    organizer: parsed.data.organizer || null,
    date: parsed.date,
    prize: parsed.data.prize || null,
    opponent: parsed.data.opponent || null,
    result: parsed.data.result || null,
    mvp: parsed.data.mvp || null,
    squadId: parsed.data.squadId,
  });

  revalidateTournaments();
  return { ok: true, message: "Tournament recorded" };
}

export async function updateTournament(
  id: string,
  input: TournamentInput,
): Promise<TournamentActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const row = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, id),
  });
  if (!row) return { ok: false, error: "Tournament not found" };
  if (!(await canManageSquad(actor.id, userRole(actor), row.squadId))) {
    return { ok: false, error: "You cannot edit this record" };
  }

  const parsed = parseInput(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  if (!(await canManageSquad(actor.id, userRole(actor), parsed.data.squadId))) {
    return { ok: false, error: "You can only assign your own squad" };
  }

  await db
    .update(tournaments)
    .set({
      name: parsed.data.name,
      organizer: parsed.data.organizer || null,
      date: parsed.date,
      prize: parsed.data.prize || null,
      opponent: parsed.data.opponent || null,
      result: parsed.data.result || null,
      mvp: parsed.data.mvp || null,
      squadId: parsed.data.squadId,
    })
    .where(eq(tournaments.id, id));

  revalidateTournaments();
  return { ok: true, message: "Tournament updated" };
}

export async function deleteTournament(
  id: string,
): Promise<TournamentActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const row = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, id),
  });
  if (!row) return { ok: false, error: "Tournament not found" };
  if (!(await canManageSquad(actor.id, userRole(actor), row.squadId))) {
    return { ok: false, error: "You cannot delete this record" };
  }

  await db.delete(tournaments).where(eq(tournaments.id, id));
  revalidateTournaments();
  return { ok: true, message: "Tournament deleted" };
}
