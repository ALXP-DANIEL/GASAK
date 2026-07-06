import { getManagedSquadIds } from "@server/authz";
import { db, squadMembers, squads } from "@server/db";
import type { OrgRole } from "@server/db/schema";
import { count, eq } from "drizzle-orm";

/** Admin-only: every squad with its member count. */
export async function listSquads() {
  return db
    .select({ squad: squads, memberCount: count(squadMembers.id) })
    .from(squads)
    .leftJoin(squadMembers, eq(squadMembers.squadId, squads.id))
    .groupBy(squads.id)
    .orderBy(squads.createdAt);
}

/** Admin-only: a squad's full roster. */
export async function getSquad(squadId: string) {
  return db.query.squads.findFirst({
    where: eq(squads.id, squadId),
    with: {
      members: {
        with: { user: { with: { profile: true } } },
      },
    },
  });
}

/** Squads the given user may manage records for, as select options. */
export async function listManagedSquadOptions(role: OrgRole, userId: string) {
  if (role === "admin") {
    const rows = await db.query.squads.findMany({
      where: eq(squads.archived, false),
      orderBy: squads.name,
    });
    return rows.map((squad) => ({ value: squad.id, label: squad.name }));
  }

  const managedIds = await getManagedSquadIds(userId);
  if (managedIds.length === 0) return [];
  const rows = await db.query.squads.findMany({
    where: eq(squads.archived, false),
    orderBy: squads.name,
  });
  return rows
    .filter((squad) => managedIds.includes(squad.id))
    .map((squad) => ({ value: squad.id, label: squad.name }));
}
