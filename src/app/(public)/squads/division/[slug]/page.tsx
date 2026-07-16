"use cache";

import { Stagger } from "@components/motion/reveal";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { LinkButton, PageHero } from "@components/ui/brand";
import { Badge } from "@components/ui/shadcn/badge";
import { SquadRowCard } from "@features/squads/components/squad-shared";
import {
  isSquadDivision,
  SQUAD_DIVISION_LABELS,
  SQUAD_DIVISION_SLUGS,
} from "@lib/labels";
import { createPageMetadata } from "@lib/metadata";
import { db, squadMembers, squads } from "@server/db";
import { and, count, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return SQUAD_DIVISION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSquadDivision(slug)) {
    return createPageMetadata({
      title: "Squads",
      description: "The competitive squads of GASAK Esports.",
      path: "/squads",
      type: "Squads",
    });
  }
  const label = SQUAD_DIVISION_LABELS[slug];
  return createPageMetadata({
    title: `${label} Squads`,
    description: `The ${label} division squads of GASAK Esports.`,
    path: `/squads/division/${slug}`,
    type: "Squads",
  });
}

export default async function DivisionSquadsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSquadDivision(slug)) notFound();

  cacheLife("hours");
  cacheTag("squads");

  const rows = await db
    .select({
      squad: squads,
      memberCount: count(squadMembers.id),
    })
    .from(squads)
    .leftJoin(squadMembers, eq(squadMembers.squadId, squads.id))
    .where(and(eq(squads.archived, false), eq(squads.division, slug)))
    .groupBy(squads.id)
    .orderBy(squads.createdAt);

  const label = SQUAD_DIVISION_LABELS[slug];

  return (
    <PageSkeleton name="squads-division-public" loading={false}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
        <PageHero
          eyebrow="Our Squads"
          title={`${label} Division`}
          description={`The teams representing GASAK under the ${label} division — tournament-ready rosters, scrims, and academy development.`}
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
              No squads in this division yet — check back soon.
            </p>
          )}
        </Stagger>

        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href="/squads" caret className="w-fit">
            View all squads
          </LinkButton>
          <LinkButton
            href="/recruitment"
            caret
            variant="outline"
            className="w-fit"
          >
            Apply now
          </LinkButton>
        </div>
      </div>
    </PageSkeleton>
  );
}
