import { BrandBadge, BrandCard, PageHero } from "@/components/ui/brand";
import { LANE_LABELS } from "@/lib/labels";
import { createPageMetadata } from "@/lib/metadata";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Players",
  description: "The players representing GASAK Esports.",
  path: "/old/players",
});

export default async function PlayersPage() {
  const profiles = await db.query.playerProfiles.findMany({
    with: {
      user: {
        with: {
          memberships: { with: { squad: true } },
        },
      },
    },
  });

  const players = profiles.filter((p) => p.ign);

  return (
    <div className="flex flex-col gap-10">
      <PageHero
        eyebrow="Players"
        title="The names behind the grind"
        description="Every registered player across GASAK squads, academy slots, and competitive rosters."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((profile) => {
          const squadNames = profile.user.memberships
            .filter((m) => !m.squad.archived)
            .map((m) => m.squad.name);
          return (
            <BrandCard key={profile.userId} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-heading text-xl font-bold tracking-wide">
                  {profile.ign}
                </h2>
                {profile.preferredLane && (
                  <BrandBadge>{LANE_LABELS[profile.preferredLane]}</BrandBadge>
                )}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>{profile.nickname ?? profile.user.name}</p>
                {profile.currentRank && <p>Rank: {profile.currentRank}</p>}
                {squadNames.length > 0 && <p>Squad: {squadNames.join(", ")}</p>}
              </div>
            </BrandCard>
          );
        })}
        {players.length === 0 && (
          <p className="text-muted-foreground">No players registered yet.</p>
        )}
      </div>
    </div>
  );
}
