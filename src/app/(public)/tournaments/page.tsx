import { desc, eq } from "drizzle-orm";
import { BrandBadge, BrandCard, PageHero } from "@/components/ui/brand";
import { formatDate } from "@/lib/format";
import { createPageMetadata } from "@/lib/metadata";
import { db, squads, tournaments } from "@/server/db";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Tournaments",
  description: "Tournament results and history for GASAK Esports squads.",
  path: "/tournaments",
});

export default async function TournamentsPage() {
  const rows = await db
    .select({ tournament: tournaments, squad: squads })
    .from(tournaments)
    .leftJoin(squads, eq(tournaments.squadId, squads.id))
    .orderBy(desc(tournaments.date));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
      <PageHero
        eyebrow="Tournaments"
        title="Every stage, every result"
        description="Tournament runs across every GASAK squad — qualifiers, community cups, and championship brackets."
      />

      <div className="grid gap-4">
        {rows.map(({ tournament, squad }) => (
          <BrandCard
            key={tournament.id}
            className="flex flex-col justify-between gap-3 p-5 desktop:flex-row desktop:items-center"
          >
            <div>
              <p className="font-heading text-lg font-bold tracking-wide">
                {tournament.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(tournament.date)}
                {squad ? ` · ${squad.name}` : ""}
                {tournament.opponent ? ` · vs ${tournament.opponent}` : ""}
              </p>
            </div>
            {tournament.result && <BrandBadge>{tournament.result}</BrandBadge>}
          </BrandCard>
        ))}
        {rows.length === 0 && (
          <p className="text-muted-foreground">
            No tournaments recorded yet — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
