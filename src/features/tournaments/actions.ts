"use server";

import type { ActionResult } from "@server/actions/public";
import { logActivity } from "@server/activity-log";
import { actionUser, canManageSquad } from "@server/authz";
import {
  fetchChallongeMatches,
  fetchChallongeParticipants,
  fetchChallongeTournament,
} from "@server/challonge";
import { db, tournamentRounds, tournaments } from "@server/db";
import { userOrgRole } from "@server/session";
import { asc, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { tournamentRoundSchema, tournamentSchema } from "./schema";
import type { TournamentInput, TournamentRoundInput } from "./types";

function parseTournament(
  input: TournamentInput,
): { error: string } | { data: TournamentInput; date: Date } {
  const parsed = tournamentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) {
    return { error: "Invalid date" };
  }
  return { data: parsed.data, date };
}

function revalidateTournaments(tournamentId?: string) {
  revalidatePath("/dashboard/tournaments");
  updateTag("tournaments");
  if (tournamentId) {
    revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  }
  revalidatePath("/dashboard");
}

export async function createTournament(
  input: TournamentInput,
): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = parseTournament(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  if (
    !(await canManageSquad(actor.id, userOrgRole(actor), parsed.data.squadId))
  ) {
    return { ok: false, error: "You can only add records for your squad" };
  }

  const tracking = parsed.data.tracking ?? "manual";

  const [row] = await db
    .insert(tournaments)
    .values({
      name: parsed.data.name,
      organizer: parsed.data.organizer || null,
      date: parsed.date,
      prizePool: parsed.data.prizePool,
      prize: parsed.data.prize || null,
      placement: parsed.data.placement || null,
      mvp: parsed.data.mvp || null,
      format: parsed.data.format,
      status: parsed.data.status,
      tracking,
      // The URL is only meaningful for Challonge-tracked tournaments —
      // real connection (challongeTournamentId/participantId) happens
      // separately via connectChallongeTournament.
      challongeUrl:
        tracking === "challonge" ? parsed.data.challongeUrl || null : null,
      squadId: parsed.data.squadId,
    })
    .returning();

  await logActivity({
    actor,
    action: "create",
    entityType: "tournament",
    entityId: row.id,
    description: `Created tournament "${row.name}"`,
  });

  revalidateTournaments();
  return { ok: true, message: "Tournament created" };
}

export async function updateTournament(
  id: string,
  input: TournamentInput,
): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const row = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, id),
  });
  if (!row) return { ok: false, error: "Tournament not found" };
  if (!(await canManageSquad(actor.id, userOrgRole(actor), row.squadId))) {
    return { ok: false, error: "You cannot edit this record" };
  }

  const parsed = parseTournament(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  if (
    !(await canManageSquad(actor.id, userOrgRole(actor), parsed.data.squadId))
  ) {
    return { ok: false, error: "You can only assign your own squad" };
  }

  await db
    .update(tournaments)
    .set({
      name: parsed.data.name,
      organizer: parsed.data.organizer || null,
      date: parsed.date,
      prizePool: parsed.data.prizePool,
      prize: parsed.data.prize || null,
      placement: parsed.data.placement || null,
      mvp: parsed.data.mvp || null,
      format: parsed.data.format,
      status: parsed.data.status,
      // tracking and challongeUrl are immutable after creation — managed
      // exclusively via the Challonge connect/sync panel on the detail page.
      squadId: parsed.data.squadId,
    })
    .where(eq(tournaments.id, id));

  await logActivity({
    actor,
    action: "update",
    entityType: "tournament",
    entityId: id,
    description: `Updated tournament "${parsed.data.name}"`,
  });

  revalidateTournaments(id);
  return { ok: true, message: "Tournament updated" };
}

export async function deleteTournament(id: string): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const row = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, id),
  });
  if (!row) return { ok: false, error: "Tournament not found" };
  if (!(await canManageSquad(actor.id, userOrgRole(actor), row.squadId))) {
    return { ok: false, error: "You cannot delete this record" };
  }

  await db.delete(tournaments).where(eq(tournaments.id, id));

  await logActivity({
    actor,
    action: "delete",
    entityType: "tournament",
    entityId: id,
    description: `Deleted tournament "${row.name}"`,
  });

  revalidateTournaments();
  return { ok: true, message: "Tournament deleted" };
}

// ---------------------------------------------------------------------------
// Rounds
// ---------------------------------------------------------------------------

type ManagedTournamentContext =
  | { ok: false; error: string }
  | {
      ok: true;
      actor: NonNullable<Awaited<ReturnType<typeof actionUser>>>;
      tournament: typeof tournaments.$inferSelect;
    };

/** Loads the parent tournament and checks the actor can manage its squad. */
async function requireManagedTournament(
  tournamentId: string,
): Promise<ManagedTournamentContext> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, tournamentId),
  });
  if (!tournament) return { ok: false, error: "Tournament not found" };

  if (
    !(await canManageSquad(actor.id, userOrgRole(actor), tournament.squadId))
  ) {
    return { ok: false, error: "You cannot manage this tournament" };
  }
  return { ok: true, actor, tournament };
}

function parseRound(
  input: TournamentRoundInput,
):
  | { error: string }
  | { data: TournamentRoundInput; scheduledAt: Date | null } {
  const parsed = tournamentRoundSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const scheduledAt = parsed.data.scheduledAt
    ? new Date(parsed.data.scheduledAt)
    : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    return { error: "Invalid scheduled time" };
  }
  return { data: parsed.data, scheduledAt };
}

export async function createTournamentRound(
  tournamentId: string,
  input: TournamentRoundInput,
): Promise<ActionResult> {
  const ctx = await requireManagedTournament(tournamentId);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const parsed = parseRound(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const existing = await db.query.tournamentRounds.findMany({
    where: eq(tournamentRounds.tournamentId, tournamentId),
    orderBy: asc(tournamentRounds.sortOrder),
  });
  const nextSortOrder = (existing.at(-1)?.sortOrder ?? -1) + 1;

  const [row] = await db
    .insert(tournamentRounds)
    .values({
      tournamentId,
      roundLabel: parsed.data.roundLabel,
      sortOrder: nextSortOrder,
      opponent: parsed.data.opponent,
      scheduledAt: parsed.scheduledAt,
      outcome: parsed.data.outcome,
      score: parsed.data.score || null,
      notes: parsed.data.notes || null,
      replayLink: parsed.data.replayLink || null,
      eventId: parsed.data.eventId ?? null,
    })
    .returning();

  await logActivity({
    actor: ctx.actor,
    action: "create",
    entityType: "tournament_round",
    entityId: row.id,
    description: `Added round "${row.roundLabel}" vs ${row.opponent} to "${ctx.tournament.name}"`,
  });

  revalidateTournaments(tournamentId);
  return { ok: true, message: "Round added" };
}

export async function updateTournamentRound(
  roundId: string,
  input: TournamentRoundInput,
): Promise<ActionResult> {
  const round = await db.query.tournamentRounds.findFirst({
    where: eq(tournamentRounds.id, roundId),
  });
  if (!round) return { ok: false, error: "Round not found" };

  const ctx = await requireManagedTournament(round.tournamentId);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const parsed = parseRound(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  await db
    .update(tournamentRounds)
    .set({
      roundLabel: parsed.data.roundLabel,
      opponent: parsed.data.opponent,
      scheduledAt: parsed.scheduledAt,
      outcome: parsed.data.outcome,
      score: parsed.data.score || null,
      notes: parsed.data.notes || null,
      replayLink: parsed.data.replayLink || null,
      eventId: parsed.data.eventId ?? null,
    })
    .where(eq(tournamentRounds.id, roundId));

  await logActivity({
    actor: ctx.actor,
    action: "update",
    entityType: "tournament_round",
    entityId: roundId,
    description: `Updated round "${parsed.data.roundLabel}" in "${ctx.tournament.name}"`,
  });

  revalidateTournaments(round.tournamentId);
  return { ok: true, message: "Round updated" };
}

export async function deleteTournamentRound(
  roundId: string,
): Promise<ActionResult> {
  const round = await db.query.tournamentRounds.findFirst({
    where: eq(tournamentRounds.id, roundId),
  });
  if (!round) return { ok: false, error: "Round not found" };

  const ctx = await requireManagedTournament(round.tournamentId);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  await db.delete(tournamentRounds).where(eq(tournamentRounds.id, roundId));

  await logActivity({
    actor: ctx.actor,
    action: "delete",
    entityType: "tournament_round",
    entityId: roundId,
    description: `Deleted round "${round.roundLabel}" from "${ctx.tournament.name}"`,
  });

  revalidateTournaments(round.tournamentId);
  return { ok: true, message: "Round deleted" };
}

// ---------------------------------------------------------------------------
// Challonge sync
// ---------------------------------------------------------------------------

export type ChallongeParticipantOption = { id: string; name: string };

export type ConnectChallongeResult =
  | { ok: false; error: string }
  | { ok: true; participants: ChallongeParticipantOption[] };

/**
 * Links a Challonge tournament (by id/slug/"subdomain-slug") and returns its
 * participants so the caller can pick which one is our squad.
 */
export async function connectChallongeTournament(
  tournamentId: string,
  challongeRef: string,
): Promise<ConnectChallongeResult> {
  const ctx = await requireManagedTournament(tournamentId);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const ref = challongeRef.trim();
  if (!ref) return { ok: false, error: "Challonge tournament is required" };

  try {
    const [remote, participants] = await Promise.all([
      fetchChallongeTournament(ref),
      fetchChallongeParticipants(ref),
    ]);

    await db
      .update(tournaments)
      .set({
        challongeTournamentId: remote.id,
        challongeUrl: remote.fullChallongeUrl,
        // Reset the participant pick — the linked bracket changed.
        challongeParticipantId: null,
      })
      .where(eq(tournaments.id, tournamentId));

    revalidateTournaments(tournamentId);
    return {
      ok: true,
      participants: participants.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Challonge request failed",
    };
  }
}

export async function selectChallongeParticipant(
  tournamentId: string,
  participantId: string,
): Promise<ActionResult> {
  const ctx = await requireManagedTournament(tournamentId);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  if (!ctx.tournament.challongeTournamentId) {
    return { ok: false, error: "Connect a Challonge tournament first" };
  }

  await db
    .update(tournaments)
    .set({ challongeParticipantId: participantId })
    .where(eq(tournaments.id, tournamentId));

  revalidateTournaments(tournamentId);
  return { ok: true, message: "Squad participant saved" };
}

export async function syncChallongeTournament(
  tournamentId: string,
): Promise<ActionResult> {
  const ctx = await requireManagedTournament(tournamentId);
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const { challongeTournamentId, challongeParticipantId } = ctx.tournament;
  if (!challongeTournamentId || !challongeParticipantId) {
    return {
      ok: false,
      error: "Connect Challonge and pick your squad's participant first",
    };
  }

  try {
    const [participants, matches] = await Promise.all([
      fetchChallongeParticipants(challongeTournamentId),
      fetchChallongeMatches(challongeTournamentId),
    ]);

    const us = participants.find((p) => p.id === challongeParticipantId);
    if (!us) {
      return {
        ok: false,
        error: "Our participant no longer exists on Challonge — reconnect",
      };
    }

    // Group-stage matches reference group player ids instead of the
    // participant id, so build one lookup covering both.
    const nameByPlayerId = new Map<string, string>();
    const ourPlayerIds = new Set<string>([us.id, ...us.groupPlayerIds]);
    for (const p of participants) {
      nameByPlayerId.set(p.id, p.name);
      for (const gid of p.groupPlayerIds) nameByPlayerId.set(gid, p.name);
    }

    const ourMatches = matches.filter((m) =>
      m.participantIds.some((id) => ourPlayerIds.has(id)),
    );

    const existing = await db.query.tournamentRounds.findMany({
      where: eq(tournamentRounds.tournamentId, tournamentId),
      orderBy: asc(tournamentRounds.sortOrder),
    });
    const existingByChallongeId = new Map(
      existing
        .filter((r) => r.challongeMatchId)
        .map((r) => [r.challongeMatchId as string, r]),
    );
    let nextSortOrder = (existing.at(-1)?.sortOrder ?? -1) + 1;

    let created = 0;
    let updated = 0;

    for (const match of ourMatches) {
      const opponentId = match.participantIds.find(
        (id) => !ourPlayerIds.has(id),
      );
      const opponent =
        (opponentId && nameByPlayerId.get(opponentId)) || "TBD";

      const outcome =
        match.state !== "complete"
          ? ("pending" as const)
          : match.winnerId !== null && ourPlayerIds.has(match.winnerId)
            ? ("win" as const)
            : match.winnerId !== null
              ? ("loss" as const)
              : ("draw" as const);

      const roundLabel =
        match.round >= 0
          ? `Round ${match.round}`
          : `Losers Round ${Math.abs(match.round)}`;

      const values = {
        roundLabel,
        opponent,
        scheduledAt: match.startedAt ? new Date(match.startedAt) : null,
        outcome,
        score: match.scores || null,
      };

      const current = existingByChallongeId.get(match.id);
      if (current) {
        await db
          .update(tournamentRounds)
          .set(values)
          .where(eq(tournamentRounds.id, current.id));
        updated += 1;
      } else {
        await db.insert(tournamentRounds).values({
          ...values,
          tournamentId,
          sortOrder: nextSortOrder,
          challongeMatchId: match.id,
        });
        nextSortOrder += 1;
        created += 1;
      }
    }

    await db
      .update(tournaments)
      .set({ lastSyncedAt: new Date() })
      .where(eq(tournaments.id, tournamentId));

    await logActivity({
      actor: ctx.actor,
      action: "sync",
      entityType: "tournament",
      entityId: tournamentId,
      description: `Synced "${ctx.tournament.name}" from Challonge (${created} new, ${updated} updated)`,
    });

    revalidateTournaments(tournamentId);
    return {
      ok: true,
      message: `Synced from Challonge — ${created} new, ${updated} updated`,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Challonge request failed",
    };
  }
}
