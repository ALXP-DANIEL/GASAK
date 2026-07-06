import { eq, inArray } from "drizzle-orm";
import { db, squadMembers, user } from "@/server/db";

/**
 * Users who manage at least one squad (squadRole leader or coach) —
 * the valid assignees for recruitment applications.
 */
export async function listSquadManagers() {
  return db
    .selectDistinct({ id: user.id, name: user.name })
    .from(squadMembers)
    .innerJoin(user, eq(user.id, squadMembers.userId))
    .where(inArray(squadMembers.squadRole, ["leader", "coach"]))
    .orderBy(user.name);
}
