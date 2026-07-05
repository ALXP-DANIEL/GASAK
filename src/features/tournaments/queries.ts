import { desc, eq, inArray } from "drizzle-orm";
import { db, tournaments } from "@/server/db";

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
    with: { squad: true },
  });
}
