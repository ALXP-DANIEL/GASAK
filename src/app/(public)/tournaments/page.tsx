import { Icons } from "@components/icons";
import { BrandBadge, BrandCard, PageHero } from "@components/ui/brand";
import { Badge } from "@components/ui/shadcn/badge";
import { formatDate } from "@lib/format";
import { createPageMetadata } from "@lib/metadata";
import { db, squads, tournaments } from "@server/db";
import { desc, eq } from "drizzle-orm";
import Image from "next/image";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Tournaments",
  description: "Tournament results and history for GASAK Esports squads.",
  path: "/tournaments",
  type: "Tournaments",
});

export default async function TournamentsPage() {
  const rows = await db
    .select({ tournament: tournaments, squad: squads })
    .from(tournaments)
    .leftJoin(squads, eq(tournaments.squadId, squads.id))
    .orderBy(desc(tournaments.date));

  const [featured, ...history] = rows;
  const resultCount = rows.filter(({ tournament }) => tournament.result).length;
  const squadCount = new Set(rows.map(({ squad }) => squad?.id).filter(Boolean))
    .size;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
      <PageHero
        eyebrow="Tournaments"
        title="Every stage, every result"
        description="Tournament runs across every GASAK squad — qualifiers, community cups, and championship brackets."
      />

      <section className="grid gap-4 desktop:grid-cols-3">
        <TournamentStat
          label="Tournament records"
          value={rows.length}
          icon={<Icons.Stats.Trophies size={18} />}
        />
        <TournamentStat
          label="Squads represented"
          value={squadCount}
          icon={<Icons.Stats.Squads size={18} />}
        />
        <TournamentStat
          label="Results logged"
          value={resultCount}
          icon={<Icons.Status.Success size={18} />}
        />
      </section>

      {!featured ? (
        <BrandCard interactive={false} className="p-8 text-center">
          <p className="text-muted-foreground">
            No tournaments recorded yet — check back soon.
          </p>
        </BrandCard>
      ) : (
        <>
          <FeaturedTournament
            tournament={featured.tournament}
            squad={featured.squad}
          />

          <section className="grid gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Archive
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold uppercase tracking-wide">
                Tournament history
              </h2>
            </div>

            <div className="relative grid gap-4">
              {history.map(({ tournament, squad }) => (
                <TournamentRow
                  key={tournament.id}
                  tournament={tournament}
                  squad={squad}
                />
              ))}
              {history.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  More tournament records will appear here after the next run.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

type Tournament = typeof tournaments.$inferSelect;
type Squad = typeof squads.$inferSelect | null;

function TournamentStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <BrandCard interactive={false} className="p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-none border text-primary">
          {icon}
        </span>
        <div>
          <p className="font-heading text-3xl font-bold">{value}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        </div>
      </div>
    </BrandCard>
  );
}

function FeaturedTournament({
  tournament,
  squad,
}: {
  tournament: Tournament;
  squad: Squad;
}) {
  return (
    <section className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_22rem]">
      <BrandCard interactive={false} className="overflow-hidden">
        <div className="relative min-h-[22rem] bg-secondary">
          {tournament.screenshotUrl ? (
            <Image
              src={tournament.screenshotUrl}
              alt={`${tournament.name} screenshot`}
              fill
              sizes="(min-width: 768px) 58rem, calc(100vw - 2rem)"
              className="object-cover opacity-70"
              unoptimized
            />
          ) : (
            <div className="grid min-h-[22rem] place-items-center">
              <Icons.Stats.Trophies size={72} className="text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-background/10" />
          <div className="absolute inset-x-0 bottom-0 p-6 desktop:p-8">
            <BrandBadge>Latest tournament</BrandBadge>
            <h2 className="mt-4 max-w-4xl text-balance font-heading text-4xl font-bold uppercase leading-tight tracking-wide desktop:text-6xl">
              {tournament.name}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground desktop:text-base">
              {formatDate(tournament.date)}
              {squad ? ` · ${squad.name}` : ""}
              {tournament.opponent ? ` · vs ${tournament.opponent}` : ""}
            </p>
          </div>
        </div>
      </BrandCard>

      <BrandCard interactive={false} className="h-fit p-5">
        <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
          Match sheet
        </h3>
        <div className="mt-5 grid gap-3">
          <Detail label="Squad" value={squad?.name ?? "Unassigned"} />
          <Detail label="Organizer" value={tournament.organizer ?? "—"} />
          <Detail label="Prize" value={tournament.prize ?? "—"} />
          <Detail label="Opponent" value={tournament.opponent ?? "—"} />
          <Detail label="MVP" value={tournament.mvp ?? "—"} />
          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Result
            </span>
            {tournament.result ? (
              <Badge>{tournament.result}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Pending</span>
            )}
          </div>
        </div>
      </BrandCard>
    </section>
  );
}

function TournamentRow({
  tournament,
  squad,
}: {
  tournament: Tournament;
  squad: Squad;
}) {
  return (
    <BrandCard
      interactive={false}
      className="grid gap-4 p-5 desktop:grid-cols-[8rem_minmax(0,1fr)_auto] desktop:items-center"
    >
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {formatDate(tournament.date)}
        </p>
      </div>

      <div className="min-w-0">
        <h3 className="truncate font-heading text-xl font-bold uppercase tracking-wide">
          {tournament.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {squad?.name ?? "Unassigned squad"}
          {tournament.opponent ? ` · vs ${tournament.opponent}` : ""}
          {tournament.organizer ? ` · ${tournament.organizer}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 desktop:justify-end">
        {tournament.mvp && <BrandBadge>MVP {tournament.mvp}</BrandBadge>}
        {tournament.result ? (
          <Badge>{tournament.result}</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        )}
      </div>
    </BrandCard>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
