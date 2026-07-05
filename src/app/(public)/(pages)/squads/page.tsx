import { count, eq } from "drizzle-orm";
import { SquadCard } from "@/components/public/content-cards";
import { BrandBadge, LinkButton, PageHero } from "@/components/ui/brand";
import { createPageMetadata } from "@/lib/metadata";
import { db, squadMembers, squads } from "@/server/db";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Squads",
  description: "The competitive squads of GASAK Esports.",
  path: "/squads",
});

export default async function SquadsPage() {
  const rows = await db
    .select({
      squad: squads,
      memberCount: count(squadMembers.id),
    })
    .from(squads)
    .leftJoin(squadMembers, eq(squadMembers.squadId, squads.id))
    .where(eq(squads.archived, false))
    .groupBy(squads.id)
    .orderBy(squads.createdAt);

  return (
    <div className="flex flex-col gap-10">
      <PageHero
        eyebrow="Our Squads"
        title="Tournament-ready rosters"
        description="The teams representing GASAK in tournaments, scrims, and academy development."
      />

      <div className="grid auto-rows-fr gap-6 md:grid-cols-2">
        {rows.map(({ squad, memberCount }) => (
          <SquadCard
            key={squad.id}
            squad={squad}
            memberCount={memberCount}
            mode="full"
          />
        ))}
        {rows.length === 0 && (
          <p className="text-muted-foreground">
            No squads yet — check back soon.
          </p>
        )}
      </div>
      <BrandBadge>Want in? Apply through the recruitment page.</BrandBadge>
      <LinkButton href="/recruitment" caret className="w-fit">
        Apply now
      </LinkButton>
    </div>
  );
}
