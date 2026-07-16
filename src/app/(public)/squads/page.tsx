"use cache";

import { Stagger } from "@components/motion/reveal";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { BrandBadge, LinkButton, PageHero } from "@components/ui/brand";
import { Badge } from "@components/ui/shadcn/badge";
import { SquadRowCard } from "@features/squads/components/squad-shared";
import { createPageMetadata } from "@lib/metadata";
import { db, squadMembers, squads } from "@server/db";
import { and, count, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

export const metadata = createPageMetadata({
  title: "Squads",
  description: "The competitive squads of GASAK Esports.",
  path: "/squads",
  type: "Squads",
});

export default async function SquadsPage() {
  cacheLife("hours");
  cacheTag("squads");

  const rows = await db
    .select({
      squad: squads,
      memberCount: count(squadMembers.id),
    })
    .from(squads)
    .leftJoin(squadMembers, eq(squadMembers.squadId, squads.id))
    .where(and(eq(squads.archived, false), eq(squads.division, "gasak")))
    .groupBy(squads.id)
    .orderBy(squads.createdAt);

  return (
    <PageSkeleton name="squads-public" loading={false}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
        <PageHero
          eyebrow="Our Squads"
          title="Tournament-ready rosters"
          description="The teams representing GASAK in tournaments, scrims, and academy development."
        />

        <Stagger className="grid gap-3 desktop:grid-cols-2">
          {rows.map(({ squad, memberCount }) => (
            <SquadRowCard
              key={squad.id}
              href={`/squads/${squad.id}`}
              squad={squad}
              memberCount={memberCount}
              showDescription
              badges={squad.recruiting && <Badge>Recruiting</Badge>}
            />
          ))}
          {rows.length === 0 && (
            <p className="text-muted-foreground">
              No squads yet — check back soon.
            </p>
          )}
        </Stagger>
        <BrandBadge>Want in? Apply through the recruitment page.</BrandBadge>
        <LinkButton href="/recruitment" caret className="w-fit">
          Apply now
        </LinkButton>
      </div>
    </PageSkeleton>
  );
}
