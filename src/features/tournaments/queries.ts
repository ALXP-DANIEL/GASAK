import { db, tournamentRounds, tournaments } from "@server/db";
import { asc, desc, eq, inArray } from "drizzle-orm";

export async function listTournaments(squadIds?: string[]) {
  if (squadIds && squadIds.length === 0) return [];
  return db.query.tournaments.findMany({
    where: squadIds ? inArray(tournaments.squadId, squadIds) : undefined,
    orderBy: desc(tournaments.date),
    with: { squad: true },
  });
}

export async function getTournament(id: string) {
  return db.query.tournaments.findFirst({
    where: eq(tournaments.id, id),
    with: {
      squad: true,
      rounds: {
        orderBy: asc(tournamentRounds.sortOrder),
        with: { event: true },
      },
    },
  });
}

export async function getTournamentRound(id: string) {
  return db.query.tournamentRounds.findFirst({
    where: eq(tournamentRounds.id, id),
    with: { tournament: true },
  });
}
