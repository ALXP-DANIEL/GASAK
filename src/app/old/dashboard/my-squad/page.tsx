import { inArray } from "drizzle-orm";
import Image from "next/image";
import {
  DashboardListItem,
  DashboardPanel,
  EmptyState,
  PageHeader,
} from "@/components/dashboard/widgets";
import { SquadAccent } from "@/components/squad-accent";
import { BrandBadge } from "@/components/ui/brand";
import { LANE_LABELS, SQUAD_ROLE_LABELS } from "@/lib/labels";
import { requireRole, userRole } from "@/lib/session";
import { getLedSquadIds, getMemberSquadIds } from "@/server/authz";
import { db, squads } from "@/server/db";
import { SquadEditForm } from "../squads/squad-form";

export const dynamic = "force-dynamic";

export default async function MySquadPage() {
  const user = await requireRole("leader", "member", "admin");
  const isLeader = userRole(user) === "leader";

  const [squadIds, ledSquadIds] = await Promise.all([
    getMemberSquadIds(user.id),
    getLedSquadIds(user.id),
  ]);
  const mySquads = squadIds.length
    ? await db.query.squads.findMany({
        where: inArray(squads.id, squadIds),
        with: {
          members: { with: { user: { with: { profile: true } } } },
        },
      })
    : [];

  const roleOrder = { leader: 0, coach: 1, member: 2, reserve: 3 } as const;

  return (
    <div>
      <PageHeader
        title="My Squad"
        description={
          isLeader
            ? "Your roster — leaders can see member contact details."
            : "Your squad and teammates."
        }
      />

      {mySquads.length === 0 && (
        <EmptyState message="You are not assigned to a squad yet. An admin will place you soon." />
      )}

      <div className="grid gap-6">
        {mySquads.map((squad) => (
          <SquadAccent key={squad.id} color={squad.accentColor}>
            <DashboardPanel
              title={squad.name}
              description={squad.description}
              action={
                squad.logoUrl && (
                  <Image
                    src={squad.logoUrl}
                    alt={`${squad.name} logo`}
                    width={44}
                    height={44}
                    className="rounded-full border object-cover"
                    unoptimized
                  />
                )
              }
            >
              <div>
                <div className="flex items-center gap-3"></div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[...squad.members]
                    .sort(
                      (a, b) => roleOrder[a.squadRole] - roleOrder[b.squadRole],
                    )
                    .map((member) => (
                      <DashboardListItem
                        key={member.id}
                        title={member.user.profile?.ign ?? member.user.name}
                        badge={
                          <BrandBadge
                            className={
                              member.squadRole === "leader"
                                ? "bg-primary text-primary-foreground"
                                : ""
                            }
                          >
                            {SQUAD_ROLE_LABELS[member.squadRole]}
                          </BrandBadge>
                        }
                      >
                        <div className="mt-1 grid gap-0.5 text-xs text-muted-foreground">
                          <p>{member.user.name}</p>
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
                      </DashboardListItem>
                    ))}
                </div>

                {ledSquadIds.includes(squad.id) && (
                  <div className="mt-6 rounded-lg border border-primary/20 bg-background/35 p-4">
                    <p className="mb-4 text-sm font-semibold">
                      Edit squad details
                    </p>
                    <SquadEditForm squad={squad} />
                  </div>
                )}
              </div>
            </DashboardPanel>
          </SquadAccent>
        ))}
      </div>
    </div>
  );
}
