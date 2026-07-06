import { Badge } from "@components/ui/shadcn/badge";
import { LANE_LABELS, SQUAD_ROLE_LABELS } from "@lib/labels";
import { requireUser } from "@lib/session";
import { getManagedSquadIds, getMemberSquadIds } from "@server/authz";
import { db, squads } from "@server/db";
import { inArray } from "drizzle-orm";
import Image from "next/image";
import {
  DashboardPanel,
  EmptyState,
  PageHeader,
} from "../_components/page-surface";

export const dynamic = "force-dynamic";

export default async function MySquadPage() {
  const user = await requireUser();
  const [squadIds, managedSquadIds] = await Promise.all([
    getMemberSquadIds(user.id),
    getManagedSquadIds(user.id),
  ]);
  const isLeader = managedSquadIds.length > 0;
  const mySquads = squadIds.length
    ? await db.query.squads.findMany({
        where: inArray(squads.id, squadIds),
        with: {
          members: { with: { user: { with: { profile: true } } } },
        },
      })
    : [];

  const roleOrder = { leader: 0, coach: 1, player: 2, reserve: 3 } as const;

  return (
    <main>
      <PageHeader
        title="My Squad"
        description={
          isLeader
            ? "Your roster. Leaders can see member contact details."
            : "Your squad and teammates."
        }
      />

      {mySquads.length === 0 ? (
        <EmptyState message="You are not assigned to a squad yet. An admin will place you soon." />
      ) : (
        <div className="grid gap-6">
          {mySquads.map((squad) => (
            <DashboardPanel
              key={squad.id}
              title={squad.name}
              description={squad.description}
              action={
                squad.logoUrl ? (
                  <Image
                    src={squad.logoUrl}
                    alt={`${squad.name} logo`}
                    width={40}
                    height={40}
                    className="border object-cover"
                    unoptimized
                  />
                ) : null
              }
            >
              <div className="grid gap-3 desktop:grid-cols-2 xl:grid-cols-3">
                {[...squad.members]
                  .sort(
                    (a, b) => roleOrder[a.squadRole] - roleOrder[b.squadRole],
                  )
                  .map((member) => (
                    <div key={member.id} className="grid gap-2 border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {member.user.profile?.ign ?? member.user.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.user.name}
                          </p>
                        </div>
                        <Badge
                          variant={
                            member.squadRole === "leader"
                              ? "default"
                              : "outline"
                          }
                        >
                          {SQUAD_ROLE_LABELS[member.squadRole]}
                        </Badge>
                      </div>

                      <div className="grid gap-0.5 text-xs text-muted-foreground">
                        {member.user.profile?.preferredLane && (
                          <p>
                            {LANE_LABELS[member.user.profile.preferredLane]}
                            {member.user.profile.currentRank
                              ? ` · ${member.user.profile.currentRank}`
                              : ""}
                          </p>
                        )}
                        {isLeader && (
                          <>
                            <p>{member.user.email}</p>
                            {member.user.profile?.phone && (
                              <p>{member.user.profile.phone}</p>
                            )}
                            {member.user.profile?.mlbbId && (
                              <p>
                                ID: {member.user.profile.mlbbId} (
                                {member.user.profile.serverId})
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </DashboardPanel>
          ))}
        </div>
      )}
    </main>
  );
}
