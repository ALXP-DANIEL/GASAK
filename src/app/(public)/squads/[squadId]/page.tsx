import { PlayerCard } from "@components/cards/player/player-card";
import { Icons } from "@components/icons";
import { Accent } from "@components/ui/accent";
import { BrandBadge, BrandCard, LinkButton } from "@components/ui/brand";
import { Badge } from "@components/ui/shadcn/badge";
import { formatDate } from "@lib/format";
import { LANE_LABELS } from "@lib/labels";
import { createPageMetadata } from "@lib/metadata";
import { db, scrims, squads, tournaments } from "@server/db";
import type { SquadRole } from "@server/db/schema";
import { desc, eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const roleOrder: Record<SquadRole, number> = {
  leader: 0,
  coach: 1,
  player: 2,
  reserve: 3,
};

function getSquadProfile(squadId: string) {
  return db.query.squads.findFirst({
    where: eq(squads.id, squadId),
    with: {
      members: {
        with: {
          user: { with: { profile: true } },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ squadId: string }>;
}) {
  const { squadId } = await params;
  const squad = await getSquadProfile(squadId);
  if (!squad || squad.archived) return {};

  return createPageMetadata({
    title: squad.name,
    description:
      squad.description ?? `The ${squad.name} squad of GASAK Esports.`,
    path: `/squads/${squad.id}`,
    type: "Squad",
    image: squad.logoUrl,
    accent: squad.accentColor,
    meta: `${squad.members.length} member${squad.members.length === 1 ? "" : "s"}${
      squad.recruiting ? " · Recruiting" : ""
    }`,
  });
}

export default async function SquadDetailPage({
  params,
}: {
  params: Promise<{ squadId: string }>;
}) {
  const { squadId } = await params;

  const squad = await getSquadProfile(squadId);

  if (!squad || squad.archived) notFound();

  const [recentTournaments, recentScrims] = await Promise.all([
    db
      .select()
      .from(tournaments)
      .where(eq(tournaments.squadId, squad.id))
      .orderBy(desc(tournaments.date))
      .limit(5),
    db
      .select()
      .from(scrims)
      .where(eq(scrims.squadId, squad.id))
      .orderBy(desc(scrims.date))
      .limit(5),
  ]);

  const roster = [...squad.members].sort(
    (a, b) => roleOrder[a.squadRole] - roleOrder[b.squadRole],
  );
  const leaders = roster.filter((member) =>
    ["leader", "coach"].includes(member.squadRole),
  );
  const players = roster.filter((member) => member.squadRole === "player");
  const reserves = roster.filter((member) => member.squadRole === "reserve");
  const filledLanes = new Set(
    roster.map((member) => member.user.profile?.preferredLane).filter(Boolean),
  ).size;

  return (
    <Accent color={squad.accentColor}>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 desktop:px-8 desktop:py-12">
        <LinkButton href="/squads" size="sm" className="w-fit">
          Back to squads
        </LinkButton>

        <section className="relative overflow-hidden rounded-lg border border-primary/25 bg-card">
          {squad.bannerUrl && (
            <Image
              src={squad.bannerUrl}
              alt={`${squad.name} banner`}
              fill
              priority
              className="object-cover opacity-25"
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/90 to-background/35" />

          <div className="relative grid gap-8 p-6 desktop:grid-cols-[1fr_auto] desktop:p-10">
            <div className="flex min-w-0 flex-col gap-6 desktop:flex-row desktop:items-end">
              <SquadLogo
                src={squad.logoUrl}
                name={squad.name}
                className="size-24 desktop:size-32"
              />
              <div className="min-w-0">
                <BrandBadge>Squad Profile</BrandBadge>
                <h1 className="mt-4 text-balance font-heading text-4xl font-bold uppercase leading-tight tracking-wide desktop:text-6xl">
                  {squad.name}
                </h1>
                {squad.description && (
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground desktop:text-base">
                    {squad.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 desktop:w-56">
              <HeroMetric label="Members" value={roster.length} />
              <HeroMetric label="Filled lanes" value={filledLanes} />
              <HeroMetric
                label="Recent matches"
                value={recentTournaments.length + recentScrims.length}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 desktop:grid-cols-4">
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
            label="Activity"
            value={recentTournaments.length + recentScrims.length}
            icon={<Icons.Stats.Trophies size={18} />}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
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
              <Badge variant="outline">
                {roster.length} member{roster.length === 1 ? "" : "s"}
              </Badge>
            </div>

            {roster.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Roster forming. Check back soon.
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
                  />
                ))}
              </div>
            )}
          </BrandCard>

          <div className="grid h-fit gap-6">
            <BrandCard interactive={false} className="p-5">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider">
                Lane spread
              </h2>
              <div className="mt-4 grid gap-2">
                {Object.entries(LANE_LABELS).map(([lane, label]) => {
                  const count = roster.filter(
                    (member) => member.user.profile?.preferredLane === lane,
                  ).length;
                  return (
                    <div
                      key={lane}
                      className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </BrandCard>

            <BrandCard interactive={false} className="p-5">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider">
                Squad status
              </h2>
              <div className="mt-4 grid gap-3 text-xs text-muted-foreground">
                <StatusNote
                  icon={<Icons.Status.Success size={16} />}
                  text="Public squad profile is active."
                />
                <StatusNote
                  icon={<Icons.Domain.Recruitment size={16} />}
                  text="Recruitment is handled through the GASAK application form."
                />
                <StatusNote
                  icon={<Icons.Domain.Calendar size={16} />}
                  text="Tournament and scrim activity is updated by squad staff."
                />
              </div>
            </BrandCard>
          </div>
        </section>

        <section className="grid gap-6 desktop:grid-cols-2">
          <ActivityPanel
            title="Tournament history"
            empty="No tournament records yet."
            items={recentTournaments.map((item) => ({
              id: item.id,
              title: item.name,
              date: item.date,
              meta: item.organizer,
              badge: item.placement,
            }))}
          />
          <ActivityPanel
            title="Recent scrims"
            empty="No scrim records yet."
            items={recentScrims.map((item) => ({
              id: item.id,
              title: `vs ${item.opponent}`,
              date: item.date,
              meta: item.notes,
              badge: item.result,
            }))}
          />
        </section>
      </main>
    </Accent>
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
      className={`grid shrink-0 place-items-center overflow-hidden rounded-md border-2 border-primary/40 bg-background ${className ?? ""}`}
    >
      <Image
        src={src ?? "/images/gasak-logo.png"}
        alt={`${name} logo`}
        width={128}
        height={128}
        className="size-full object-cover"
        unoptimized={Boolean(src)}
      />
    </div>
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
    <BrandCard interactive={false} className="p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-none border text-primary">
          {icon}
        </span>
        <div>
          <p className="font-heading text-2xl font-bold">{value}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        </div>
      </div>
    </BrandCard>
  );
}

function StatusNote({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-primary">{icon}</span>
      <span className="leading-5">{text}</span>
    </div>
  );
}

function ActivityPanel({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: {
    id: string;
    title: string;
    date: Date;
    meta?: string | null;
    badge?: string | null;
  }[];
}) {
  return (
    <BrandCard interactive={false} className="p-5 desktop:p-7">
      <h2 className="font-heading text-xl font-bold uppercase tracking-wide">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-5 grid gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0 desktop:flex-row desktop:items-center"
            >
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(item.date)}
                  {item.meta ? ` · ${item.meta}` : ""}
                </p>
              </div>
              {item.badge && <BrandBadge>{item.badge}</BrandBadge>}
            </div>
          ))}
        </div>
      )}
    </BrandCard>
  );
}
