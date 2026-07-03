import { Badge } from "@/components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { LANE_LABELS } from "@/lib/labels";
import { createPageMetadata } from "@/lib/metadata";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Players",
  description: "The players representing GASAK Esports.",
  path: "/players",
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Players</h1>
        <p className="mt-2 text-muted-foreground">
          Every registered player across GASAK squads.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((profile) => {
          const squadNames = profile.user.memberships
            .filter((m) => !m.squad.archived)
            .map((m) => m.squad.name);
          return (
            <Card key={profile.userId}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{profile.ign}</CardTitle>
                  {profile.preferredLane && (
                    <Badge variant="secondary">
                      {LANE_LABELS[profile.preferredLane]}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{profile.nickname ?? profile.user.name}</p>
                {profile.currentRank && <p>Rank: {profile.currentRank}</p>}
                {squadNames.length > 0 && <p>Squad: {squadNames.join(", ")}</p>}
              </CardContent>
            </Card>
          );
        })}
        {players.length === 0 && (
          <p className="text-muted-foreground">No players registered yet.</p>
        )}
      </div>
    </div>
  );
}
