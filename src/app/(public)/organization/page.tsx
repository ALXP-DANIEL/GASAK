import { buildOrgTree, OrgChart } from "@components/org-chart/org-chart";
import { PageHero } from "@components/ui/brand";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/shadcn/avatar";
import { initials } from "@lib/format";
import { createPageMetadata } from "@lib/metadata";
import { db } from "@server/db";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Organization",
  description: "The people behind GASAK Esports.",
  path: "/organization",
  type: "Organization",
});

export default async function OrganizationPage() {
  const positions = await db.query.organizationPositions.findMany({
    orderBy: (t, { asc }) => asc(t.sortOrder),
    with: { user: true },
  });
  const tree = buildOrgTree(positions);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
      <PageHero
        eyebrow="Organization"
        title="Who runs GASAK"
        description="The positions and people leading the organization."
      />

      {positions.length === 0 ? (
        <p className="text-muted-foreground">No positions published yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <OrgChart
            nodes={tree}
            renderNode={(node) => (
              <div className="flex min-w-44 flex-col items-center gap-3 text-center">
                <Avatar className="size-16 border-2 border-primary/30 shadow-md shadow-primary/10">
                  <AvatarImage
                    src={node.user?.image ?? undefined}
                    alt={node.user?.name ?? node.title}
                  />
                  <AvatarFallback className="bg-primary/10 font-heading text-lg font-bold text-primary">
                    {node.user ? initials(node.user.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <span className="font-heading text-base font-bold uppercase tracking-normal">
                    {node.title}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {node.user?.name ?? "Vacant"}
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
