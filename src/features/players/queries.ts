import { eq } from "drizzle-orm";
import { db, user } from "@/server/db";

/** Admin-only: every player profile. */
export async function listPlayers() {
  return db.query.playerProfiles.findMany({
    with: { user: true },
    orderBy: (profiles, { asc }) => asc(profiles.ign),
  });
}

export async function getPlayer(userId: string) {
  return db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      profile: true,
      memberships: { with: { squad: true } },
    },
  });
}
