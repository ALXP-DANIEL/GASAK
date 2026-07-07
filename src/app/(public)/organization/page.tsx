import { buildOrgTree, OrgChart } from "@components/org-chart/org-chart";
import { PageHero } from "@components/ui/brand";
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
              <div className="flex flex-col items-center text-center">
                <span className="flex items-center gap-1 font-semibold">
                  {node.icon && <span>{node.icon}</span>}
                  {node.title}
                </span>
                <span className="text-sm text-muted-foreground">
                  {node.user?.name ?? "Vacant"}
                </span>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
