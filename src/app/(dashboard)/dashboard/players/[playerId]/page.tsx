import {
  DetailRow,
  PageHeader,
} from "@app/(dashboard)/dashboard/_components/page-surface";
import { PlayerCard } from "@components/cards/player/player-card";
import { SplitView } from "@components/shared/split-view";
import { Badge } from "@components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { getPlayer } from "@features/players/queries";
import { LANE_LABELS, ORG_ROLE_LABELS, SQUAD_ROLE_LABELS } from "@lib/labels";
import { userOrgRole } from "@server/session";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardRole } from "../../_components/dashboard-section";

export const dynamic = "force-dynamic";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  await requireDashboardRole("admin");
  const { playerId } = await params;
  const player = await getPlayer(playerId);
  if (!player) notFound();

  const profile = player.profile;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={player.name}
        description="Player profile"
        actions={
          <Badge variant="outline">
            {ORG_ROLE_LABELS[userOrgRole(player)]}
          </Badge>
        }
      />
      <SplitView
        className="gap-4"
        aside={
          <PlayerCard
            name={player.name}
            email={player.email}
            image={player.image}
            profile={profile}
            showContact
            className="h-fit"
          />
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Player details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <DetailRow label="Full Name" value={profile?.fullName ?? "—"} />
            <DetailRow label="Nickname" value={profile?.nickname ?? "—"} />
            <DetailRow label="IGN" value={profile?.ign ?? "—"} />
            <DetailRow label="MLBB ID" value={profile?.mlbbId ?? "—"} />
            <DetailRow label="Server ID" value={profile?.serverId ?? "—"} />
            <DetailRow label="Phone" value={profile?.phone ?? "—"} />
            <DetailRow
              label="Preferred Lane"
              value={
                profile?.preferredLane
                  ? LANE_LABELS[profile.preferredLane]
                  : "—"
              }
            />
            <DetailRow
              label="Current Rank"
              value={profile?.currentRank ?? "—"}
            />
            <DetailRow label="Peak Rank" value={profile?.peakRank ?? "—"} />
            <DetailRow label="Email" value={player.email} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Squads
            </p>
            {player.memberships.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Not in any squad yet.
              </p>
            )}
            {player.memberships.map((membership) => (
              <div
                key={membership.id}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <Link
                  href={`/dashboard/squads/${membership.squadId}`}
                  className="text-sm font-medium hover:underline"
                >
                  {membership.squad.name}
                </Link>
                <Badge variant="outline">
                  {SQUAD_ROLE_LABELS[membership.squadRole]}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </SplitView>
    </div>
  );
}
