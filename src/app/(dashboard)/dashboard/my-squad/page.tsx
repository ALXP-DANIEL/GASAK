import { PlayerCard } from "@components/cards/player/player-card";
import { Icons } from "@components/icons";
import { Badge } from "@components/ui/shadcn/badge";
import { Button } from "@components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { LANE_LABELS, SQUAD_ROLE_LABELS } from "@lib/labels";
import { cn } from "@lib/utils";
import { getManagedSquadIds, getMemberSquadIds } from "@server/authz";
import { db, squads } from "@server/db";
import type { SquadRole } from "@server/db/schema";
import { requireUser } from "@server/session";
import { inArray } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { EmptyState, PageHeader } from "../_components/page-surface";

export const dynamic = "force-dynamic";

const roleOrder: Record<SquadRole, number> = {
  leader: 0,
  coach: 1,
  player: 2,
  reserve: 3,
};

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
        description={
          canSeeContacts
            ? "Roster overview, player lanes, ranks, and leader contact details."
            : "Your active squad roster, roles, lanes, and player progress."
        }
      />

      {mySquads.length === 0 ? (
        <EmptyState message="You are not assigned to a squad yet. An admin will place you soon." />
      ) : (
        <div className="grid gap-8">
          {mySquads.map((squad) => {
            const members = [...squad.members].sort(
              (a, b) => roleOrder[a.squadRole] - roleOrder[b.squadRole],
            );
            const leaders = members.filter((member) =>
              ["leader", "coach"].includes(member.squadRole),
            );
            const activePlayers = members.filter(
              (member) => member.squadRole === "player",
            );
            const reserves = members.filter(
              (member) => member.squadRole === "reserve",
            );
            const isManaged = managedSquadIds.includes(squad.id);

            return (
              <section key={squad.id} className="grid gap-5">
                <div className="relative overflow-hidden rounded-none border bg-card">
                  {squad.bannerUrl && (
                    <Image
                      src={squad.bannerUrl}
                      alt={`${squad.name} banner`}
                      fill
                      className="object-cover opacity-20"
                      unoptimized
                    />
                  )}
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
                      <Button variant="outline" asChild className="w-fit">
                        <Link href={`/dashboard/squads/${squad.id}`}>
                          Manage squad
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 desktop:grid-cols-4">
                  <SquadStat
                    label="Leadership"
                    value={leaders.length}
                    icon={<Icons.Domain.Members size={18} />}
                  />
                  <SquadStat
                    label="Players"
                    value={activePlayers.length}
                    icon={<Icons.Domain.Players size={18} />}
                  />
                  <SquadStat
                    label="Reserve"
                    value={reserves.length}
                    icon={<Icons.Stats.Players size={18} />}
                  />
                  <SquadStat
                    label="Filled lanes"
                    value={
                      new Set(
                        members
                          .map((member) => member.user.profile?.preferredLane)
                          .filter(Boolean),
                      ).size
                    }
                    icon={<Icons.Domain.Scrims size={18} />}
                  />
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
                  <Card className="shadow-xs">
                    <CardHeader>
                      <CardTitle>Roster</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 desktop:grid-cols-2">
                        {members.map((member) => (
                          <PlayerCard
                            key={member.id}
                            name={member.user.name}
                            email={member.user.email}
                            image={member.user.image}
                            profile={member.user.profile}
                            squadRole={member.squadRole}
                            showContact={canSeeContacts}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid h-fit gap-5">
                    <Card className="shadow-xs">
                      <CardHeader>
                        <CardTitle>Lane spread</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-2">
                        {Object.entries(LANE_LABELS).map(([lane, label]) => {
                          const count = members.filter(
                            (member) =>
                              member.user.profile?.preferredLane === lane,
                          ).length;
                          return (
                            <div
                              key={lane}
                              className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-b-0"
                            >
                              <span className="text-muted-foreground">
                                {label}
                              </span>
                              <span className="font-medium">{count}</span>
                            </div>
                          );
                        })}
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
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

function SquadLogo({
  src,
  name,
  className,
}: {
  src: string | null;
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-none border bg-background",
        className,
      )}
    >
      <Image
        src={src ?? "/images/gasak-logo.png"}
        alt={`${name} logo`}
        width={80}
        height={80}
        className="size-full object-cover"
        unoptimized={Boolean(src)}
      />
    </div>
  );
}

function SquadStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="shadow-xs">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid size-9 place-items-center rounded-none border text-primary">
          {icon}
        </span>
        <div>
          <p className="font-heading text-2xl font-bold">{value}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
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
