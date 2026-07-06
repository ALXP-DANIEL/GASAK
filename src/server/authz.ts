import { and, eq, inArray } from "drizzle-orm";
import { getSession, type SessionUser, userOrgRole } from "@/lib/session";
import { db, type OrgRole, type SquadRole, squadMembers } from "@/server/db";

/**
 * Session guard for server actions — returns null instead of redirecting so
 * actions can respond with an error message. Checks organization role only;
 * squad-level access goes through the squad helpers below.
 */
export async function actionOrgUser(
  ...roles: OrgRole[]
): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  if (roles.length > 0 && !roles.includes(userOrgRole(session.user))) {
    return null;
  }
  return session.user;
}

// Temporary alias while call sites migrate to actionOrgUser
export const actionUser = actionOrgUser;

export async function getSquadMembership(userId: string, squadId: string) {
  return db.query.squadMembers.findFirst({
    where: and(
      eq(squadMembers.userId, userId),
      eq(squadMembers.squadId, squadId),
    ),
  });
}

export async function getSquadRole(userId: string, squadId: string) {
  const membership = await getSquadMembership(userId, squadId);
  return membership?.squadRole ?? null;
}

export async function isSquadLeader(userId: string, squadId: string) {
  const squadRole = await getSquadRole(userId, squadId);
  return squadRole === "leader";
}

/** Squads where the user is a squad manager (leader or coach). */
export async function getManagedSquadIds(userId: string) {
  const rows = await db
    .select({ squadId: squadMembers.squadId })
    .from(squadMembers)
    .where(
      and(
        eq(squadMembers.userId, userId),
        inArray(squadMembers.squadRole, ["leader", "coach"]),
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

const SQUAD_ROLE_RANK: Record<SquadRole, number> = {
  leader: 0,
  coach: 1,
  player: 2,
  reserve: 3,
};

/**
 * The user's highest-authority squad role across every squad they belong to
 * (leader > coach > player > reserve) — used for display, e.g. labeling the
 * sidebar's Manage/Player focus toggle with their actual squad role.
 */
export async function getPrimarySquadRole(
  userId: string,
): Promise<SquadRole | null> {
  const rows = await db
    .select({ squadRole: squadMembers.squadRole })
    .from(squadMembers)
    .where(eq(squadMembers.userId, userId));
  if (rows.length === 0) return null;

  return rows.reduce((best, row) =>
    SQUAD_ROLE_RANK[row.squadRole] < SQUAD_ROLE_RANK[best.squadRole]
      ? row
      : best,
  ).squadRole;
}

/** Admins manage globally; squad leaders/coaches manage their own squad. */
export async function canManageSquad(
  userId: string,
  orgRole: OrgRole,
  squadId: string | null,
) {
  if (orgRole === "admin") return true;
  if (!squadId) return false;
  const squadRole = await getSquadRole(userId, squadId);
  return squadRole === "leader" || squadRole === "coach";
}
