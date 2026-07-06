import { count, eq } from "drizzle-orm";
import { ContentCardGrid } from "@/components/cards";
import { SquadCard } from "@/components/squads/squad-card";
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
      <PageHero
        eyebrow="Our Squads"
        title="Tournament-ready rosters"
        description="The teams representing GASAK in tournaments, scrims, and academy development."
      />

      <ContentCardGrid density="wide">
        {rows.map(({ squad, memberCount }) => (
          <SquadCard
            key={squad.id}
            squad={squad}
            memberCount={memberCount}
            variant="default"
          />
        ))}
        {rows.length === 0 && (
          <p className="text-muted-foreground">
            No squads yet — check back soon.
          </p>
        )}
      </ContentCardGrid>
      <BrandBadge>Want in? Apply through the recruitment page.</BrandBadge>
      <LinkButton href="/recruitment" caret className="w-fit">
        Apply now
      </LinkButton>
    </div>
  );
}
