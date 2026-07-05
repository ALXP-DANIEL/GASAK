import { count, eq } from "drizzle-orm";
import { getLedSquadIds } from "@/server/authz";
import { db, squadMembers, squads } from "@/server/db";
import type { Role } from "@/server/db/schema";

export async function listTeams() {
  return db
    .select({ squad: squads, memberCount: count(squadMembers.id) })
    .from(squads)
    .leftJoin(squadMembers, eq(squadMembers.squadId, squads.id))
    .groupBy(squads.id)
    .orderBy(squads.createdAt);
}

export async function getTeam(id: string) {
  return db.query.squads.findFirst({
    where: eq(squads.id, id),
    with: {
      members: {
        with: { user: { with: { profile: true } } },
      },
    },
  });
}

/** Squads the given user may manage records for, as select options. */
export async function listManagedTeamOptions(role: Role, userId: string) {
  if (role === "admin") {
    const rows = await db.query.squads.findMany({
      where: eq(squads.archived, false),
      orderBy: squads.name,
    });
    return rows.map((squad) => ({ value: squad.id, label: squad.name }));
  }

  const ledIds = await getLedSquadIds(userId);
  if (ledIds.length === 0) return [];
  const rows = await db.query.squads.findMany({
    where: eq(squads.archived, false),
    orderBy: squads.name,
  });
  return rows
    .filter((squad) => ledIds.includes(squad.id))
    .map((squad) => ({ value: squad.id, label: squad.name }));
}
