import { ProfileHeroCard } from "@components/cards/player/profile-hero-card";
import { Icons } from "@components/icons";
import { Reveal } from "@components/motion/reveal";
import { CornerCutBorder } from "@components/shared/corner-cut-border";
import { SplitView } from "@components/shared/split-view";
import { Badge } from "@components/ui/shadcn/badge";
import { Button } from "@components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import {
  LaneSpread,
  rosterBreakdown,
  SquadLogo,
  SquadStat,
  sortRoster,
} from "@features/squads/components/squad-shared";
import { SQUAD_ROLE_LABELS } from "@lib/labels";
import { getManagedSquadIds, getMemberSquadIds } from "@server/authz";
import { db, squads } from "@server/db";
import { requireUser } from "@server/session";
import { inArray } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { EmptyState, PageHeader } from "../_components/page-surface";

async function getMySquads(squadIds: string[]) {
  if (squadIds.length === 0) return [];

  return db.query.squads.findMany({
    where: inArray(squads.id, squadIds),
    with: {
      members: { with: { user: { with: { profile: true } } } },
    },
  });
}

type SquadWithMembers = Awaited<ReturnType<typeof getMySquads>>[number];
type SquadMemberWithUser = SquadWithMembers["members"][number];

export default async function MySquadPage() {
  const user = await requireUser();
  const [squadIds, managedSquadIds] = await Promise.all([
    getMemberSquadIds(user.id),
    getManagedSquadIds(user.id),
  ]);

  const mySquads = await getMySquads(squadIds);

  const canSeeContacts = managedSquadIds.length > 0;

  return (
    <main>
      <PageHeader
        title="My Squad"
        kicker="Squad"
        icon={Icons.Domain.Members}
        description={
          canSeeContacts
            ? "Roster overview, player lanes, ranks, and leader contact details."
            : "Your active squad roster, roles, lanes, and player progress."
        }
      />

      {mySquads.length === 0 ? (
        <EmptyState
          message="You are not assigned to a squad yet. An admin will place you soon."
          icon={Icons.Stats.Squads}
        />
      ) : (
        <div className="grid gap-8">
          {mySquads.map((squad) => {
            const members = sortRoster(squad.members);
            const { leaders, players, reserves, filledLanes } =
              rosterBreakdown(members);
            const isManaged = managedSquadIds.includes(squad.id);

            return (
              <section key={squad.id} className="grid gap-5">
                <Reveal>
                  <CornerCutBorder contentClassName="relative overflow-hidden bg-card">
                    {squad.bannerUrl && (
                      <Image
                        src={squad.bannerUrl}
                        alt={`${squad.name} banner`}
                        fill
                        className="object-cover opacity-20"
                      />
                    )}
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-linear-to-r from-background/70 to-transparent"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-1"
                      style={{
                        backgroundColor: squad.accentColor ?? "var(--primary)",
                      }}
                    />
                    <div className="relative grid gap-6 p-5 desktop:grid-cols-[1fr_auto] desktop:p-7">
                      <div className="flex min-w-0 gap-4">
                        <SquadLogo
                          src={squad.logoUrl}
                          name={squad.name}
                          className="size-16 desktop:size-20"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={isManaged ? "default" : "outline"}>
                              {isManaged ? "Managed squad" : "Member squad"}
                            </Badge>
                            <Badge variant="secondary">
                              {members.length} member
                              {members.length === 1 ? "" : "s"}
                            </Badge>
                          </div>
                          <h2 className="mt-3 text-balance font-heading text-3xl font-bold uppercase tracking-wide">
                            {squad.name}
                          </h2>
                          {squad.description && (
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                              {squad.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {isManaged && (
                        <Button
                          variant="outline"
                          className="w-fit"
                          render={
                            <Link href={`/dashboard/squads/${squad.id}`}>
                              Manage squad
                            </Link>
                          }
                        />
                      )}
                    </div>
                  </CornerCutBorder>
                </Reveal>

                <div className="grid grid-cols-2 gap-4 desktop:grid-cols-4">
                  <SquadStat
                    label="Leadership"
                    value={leaders.length}
                    icon={<Icons.Domain.Members size={18} />}
                  />
                  <SquadStat
                    label="Players"
                    value={players.length}
                    icon={<Icons.Domain.Players size={18} />}
                  />
                  <SquadStat
                    label="Reserve"
                    value={reserves.length}
                    icon={<Icons.Stats.Players size={18} />}
                  />
                  <SquadStat
                    label="Filled lanes"
                    value={filledLanes}
                    icon={<Icons.Domain.Scrims size={18} />}
                  />
                </div>

                <SplitView
                  className="gap-5"
                  aside={
                    <>
                      <Card className="shadow-xs">
                        <CardHeader>
                          <CardTitle>Lane spread</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <LaneSpread members={members} />
                        </CardContent>
                      </Card>

                      {canSeeContacts && (
                        <Card className="shadow-xs">
                          <CardHeader>
                            <CardTitle>Leader contacts</CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-3">
                            {members.map((member) => (
                              <ContactRow key={member.id} member={member} />
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  }
                >
                  <Card className="shadow-xs">
                    <CardHeader>
                      <CardTitle>Roster</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 desktop:grid-cols-2">
                        {members.map((member) => (
                          <ProfileHeroCard
                            key={member.id}
                            name={member.user.name}
                            image={member.user.image}
                            profile={member.user.profile}
                            squadRole={member.squadRole}
                            compact
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </SplitView>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

function ContactRow({ member }: { member: SquadMemberWithUser }) {
  const profile = member.user.profile;

  return (
    <div className="grid gap-1 border-b pb-3 text-xs last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{profile?.ign ?? member.user.name}</span>
        <Badge variant="outline">{SQUAD_ROLE_LABELS[member.squadRole]}</Badge>
      </div>
      <p className="truncate text-muted-foreground">{member.user.email}</p>
      {profile?.phone && (
        <p className="truncate text-muted-foreground">{profile.phone}</p>
      )}
    </div>
  );
}
