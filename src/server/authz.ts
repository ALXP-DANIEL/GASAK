import { and, eq } from "drizzle-orm";
import { getSession, type SessionUser, userRole } from "@/lib/session";
import { db, type Role, squadMembers } from "@/server/db";

/**
 * Session guard for server actions — returns null instead of redirecting so
 * actions can respond with an error message.
 */
export async function actionUser(
  ...roles: Role[]
): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  if (roles.length > 0 && !roles.includes(userRole(session.user))) return null;
  return session.user;
}

export async function isSquadLeader(userId: string, squadId: string) {
  const row = await db.query.squadMembers.findFirst({
    where: and(
      eq(squadMembers.userId, userId),
      eq(squadMembers.squadId, squadId),
      eq(squadMembers.squadRole, "leader"),
    ),
  });
  return Boolean(row);
}

/** Squads where the user sits as squad leader. */
export async function getLedSquadIds(userId: string) {
  const rows = await db
    .select({ squadId: squadMembers.squadId })
    .from(squadMembers)
    .where(
      and(
        eq(squadMembers.userId, userId),
        eq(squadMembers.squadRole, "leader"),
      ),
    );
  return rows.map((r) => r.squadId);
}

/** All squads the user belongs to in any squad role. */
export async function getMemberSquadIds(userId: string) {
  const rows = await db
    .select({ squadId: squadMembers.squadId })
    .from(squadMembers)
    .where(eq(squadMembers.userId, userId));
  return rows.map((r) => r.squadId);
}
