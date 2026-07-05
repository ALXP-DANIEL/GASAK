import { desc, eq, inArray } from "drizzle-orm";
import { db, scrims } from "@/server/db";

export async function listMatches(squadIds?: string[]) {
  if (squadIds && squadIds.length === 0) return [];
  return db.query.scrims.findMany({
    where: squadIds ? inArray(scrims.squadId, squadIds) : undefined,
    orderBy: desc(scrims.date),
    with: { squad: true },
  });
}

export async function getMatch(id: string) {
  return db.query.scrims.findFirst({
    where: eq(scrims.id, id),
    with: { squad: true },
  });
}
