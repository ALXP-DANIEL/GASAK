"use cache";

import { buildOrgTree, OrgChart } from "@components/org-chart/org-chart";
import { OrgChartPanZoom } from "@components/org-chart/org-chart-pan-zoom";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { PageHero } from "@components/ui/brand";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/shadcn/avatar";
import { initials } from "@lib/format";
import { createPageMetadata } from "@lib/metadata";
import { db } from "@server/db";
import { cacheLife, cacheTag } from "next/cache";

export const metadata = createPageMetadata({
  title: "Organization",
  description: "The people behind GASAK Esports.",
  path: "/organization",
  type: "Organization",
});

export default async function OrganizationPage() {
  cacheLife("hours");
  cacheTag("organization");

  const positions = await db.query.organizationPositions.findMany({
    orderBy: (t, { asc }) => asc(t.sortOrder),
    with: { user: true },
  });
  const tree = buildOrgTree(positions);

  return (
    <PageSkeleton name="organization-public" loading={false}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
        <PageHero
          eyebrow="Organization"
          title="Who runs GASAK"
          description="The positions and people leading the organization."
        />

        {positions.length === 0 ? (
          <p className="text-muted-foreground">No positions published yet.</p>
        ) : (
          <OrgChartPanZoom>
            <OrgChart
              nodes={tree}
              renderNode={(node) => (
                <div className="flex min-w-44 mobile:min-w-28 flex-col items-center gap-3 mobile:gap-2 text-center">
                  <Avatar className="size-16 mobile:size-12 border-2 border-primary/30 shadow-md shadow-primary/10">
                    <AvatarImage
                      src={node.user?.image ?? undefined}
                      alt={node.user?.name ?? node.title}
                    />
                    <AvatarFallback className="bg-primary/10 font-heading text-lg mobile:text-sm font-bold text-primary">
                      {node.user ? initials(node.user.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <span className="font-heading text-base mobile:text-sm font-bold uppercase tracking-normal">
                      {node.title}
                    </span>
                    <span className="text-sm mobile:text-xs text-muted-foreground">
                      {node.user?.name ?? "Vacant"}
                    </span>
                  </div>
                </div>
              )}
            />
          </OrgChartPanZoom>
        )}
      </div>
    </PageSkeleton>
  );
}
