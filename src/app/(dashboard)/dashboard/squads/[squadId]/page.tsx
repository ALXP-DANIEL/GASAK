import { BreadcrumbLabelSync } from "@app/(dashboard)/dashboard/_components/breadcrumb-label-sync";
import { PlayerCard } from "@components/cards/player/player-card";
import { Icons } from "@components/icons";
import { SplitView } from "@components/shared/split-view";
import { Accent } from "@components/ui/accent";
import { BrandBadge, BrandCard } from "@components/ui/brand";
import { Badge } from "@components/ui/shadcn/badge";
import {
  LaneSpread,
  rosterBreakdown,
  SquadLogo,
  SquadStat,
  sortRoster,
} from "@features/squads/components/squad-shared";
import { getSquad } from "@features/squads/queries";
import { canManageSquad } from "@server/authz";
import { db } from "@server/db";
import { requireUser, userOrgRole } from "@server/session";
import Image from "next/image";
import { forbidden, notFound } from "next/navigation";
import {
  AddSquadMemberDialog,
  SquadArchiveButton,
  SquadDeleteButton,
  SquadEditDialog,
  SquadRosterTable,
} from "../_components/squad-manage";

export default async function SquadDetailPage({
  params,
}: {
  params: Promise<{ squadId: string }>;
}) {
  const actor = await requireUser();
  const role = userOrgRole(actor);
  const { squadId } = await params;

  const squad = await getSquad(squadId);
  if (!squad) notFound();

  const isAdmin = role === "admin";
  const canManage = isAdmin || (await canManageSquad(actor.id, role, squadId));
  if (!canManage) forbidden();

  const candidates = canManage
    ? (
        await db.query.user.findMany({
          orderBy: (t, { asc }) => asc(t.name),
          with: { memberships: true },
        })
      )
        .filter((u) => u.memberships.length === 0)
        .map((u) => ({ id: u.id, name: u.name, email: u.email }))
    : [];

  const roster = sortRoster(squad.members);
  const { leaders, players, reserves, filledLanes } = rosterBreakdown(roster);

  return (
    <Accent color={squad.accentColor}>
      <BreadcrumbLabelSync label={squad.name} />
      <div className="grid gap-6">
        <section className="relative overflow-hidden rounded-lg border border-primary/25 bg-card">
          {squad.bannerUrl && (
            <Image
              src={squad.bannerUrl}
              alt={`${squad.name} banner`}
              fill
              priority
              className="object-cover opacity-20"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/90 to-background/35" />

          <div className="relative grid gap-6 p-5 desktop:grid-cols-[1fr_auto] desktop:p-8">
            <div className="flex min-w-0 flex-col gap-5 desktop:flex-row desktop:items-end">
              <SquadLogo
                src={squad.logoUrl}
                name={squad.name}
                className="size-24 desktop:size-28"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <BrandBadge>Dashboard squad</BrandBadge>
                  {squad.archived && <Badge variant="outline">Archived</Badge>}
                </div>
                <h1 className="mt-4 text-balance font-heading text-4xl font-bold uppercase leading-tight tracking-wide desktop:text-5xl">
                  {squad.name}
                </h1>
                {squad.description && (
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                    {squad.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 desktop:w-56">
              <HeroMetric label="Members" value={roster.length} />
              <HeroMetric label="Filled lanes" value={filledLanes} />
              <HeroMetric label="Leadership" value={leaders.length} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 desktop:grid-cols-4">
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
        </section>

        <SplitView
          aside={
            <>
              <BrandCard interactive={false} className="p-5">
                <h2 className="font-heading text-sm font-bold uppercase tracking-wider">
                  Lane spread
                </h2>
                <div className="mt-4">
                  <LaneSpread members={roster} />
                </div>
              </BrandCard>

              <BrandCard interactive={false} className="p-5">
                <h2 className="font-heading text-sm font-bold uppercase tracking-wider">
                  Manage squad
                </h2>
                <div className="mt-4 grid gap-3">
                  <SquadEditDialog squad={squad} />
                  {isAdmin && (
                    <>
                      <SquadArchiveButton
                        squadId={squad.id}
                        archived={squad.archived}
                      />
                      <SquadDeleteButton
                        squadId={squad.id}
                        squadName={squad.name}
                      />
                    </>
                  )}
                </div>
              </BrandCard>

              {canManage && roster.length > 0 && (
                <BrandCard interactive={false} className="p-5">
                  <h2 className="font-heading text-sm font-bold uppercase tracking-wider">
                    Role controls
                  </h2>
                  <div className="mt-4 overflow-x-auto">
                    <SquadRosterTable members={squad.members} canManage />
                  </div>
                </BrandCard>
              )}
            </>
          }
        >
          <BrandCard interactive={false} className="p-5 desktop:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  Roster
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold uppercase tracking-wide">
                  Active lineup
                </h2>
              </div>
              {canManage && (
                <AddSquadMemberDialog
                  squadId={squad.id}
                  candidates={candidates}
                />
              )}
            </div>

            {roster.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                No members yet.
              </p>
            ) : (
              <div className="mt-6 grid gap-3 desktop:grid-cols-2">
                {roster.map((member) => (
                  <PlayerCard
                    key={member.id}
                    name={member.user.name}
                    email={member.user.email}
                    image={member.user.image}
                    profile={member.user.profile}
                    squadRole={member.squadRole}
                    showContact
                  />
                ))}
              </div>
            )}
          </BrandCard>
        </SplitView>
      </div>
    </Accent>
  );
}

function HeroMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-primary/20 bg-background/70 p-3">
      <p className="font-heading text-2xl font-bold text-primary">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
