import { buildOrgTree, OrgChart } from "@components/org-chart/org-chart";
import { DeleteButton } from "@components/shared/delete-button";
import { deleteOrganizationPosition } from "@server/actions/organization";
import { db } from "@server/db";
import { requireDashboardRole } from "../_components/dashboard-section";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { OrganizationPositionFormDialog } from "./_components/organization-form";

export const dynamic = "force-dynamic";

export default async function OrganizationPage() {
  await requireDashboardRole("admin");

  const positions = await db.query.organizationPositions.findMany({
    orderBy: (t, { asc }) => asc(t.sortOrder),
    with: { user: true },
  });

  const candidateUsers = await db.query.user.findMany({
    orderBy: (t, { asc }) => asc(t.name),
    with: { organizationPositions: true },
  });

  const allPositions = positions.map((p) => ({
    id: p.id,
    title: p.title,
    parentId: p.parentId,
  }));

  const tree = buildOrgTree(positions);

  return (
    <main>
      <PageHeader
        title="Organization"
        description="Manage the public organization chart — hierarchy, titles, and who holds them."
      >
        <OrganizationPositionFormDialog
          candidateUsers={candidateUsers}
          allPositions={allPositions}
        />
      </PageHeader>

      {tree.length === 0 ? (
        <EmptyState message="No positions yet. Add your first position." />
      ) : (
        <div className="overflow-x-auto">
          <OrgChart
            nodes={tree}
            renderNode={(node) => (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex items-center gap-1">
                  {node.icon && <span>{node.icon}</span>}
                  <span className="font-semibold">{node.title}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {node.user?.name ?? "Vacant"}
                </span>
                <div className="flex items-center gap-2">
                  <OrganizationPositionFormDialog
                    position={node}
                    candidateUsers={candidateUsers}
                    allPositions={allPositions}
                  />
                  <DeleteButton
                    action={deleteOrganizationPosition.bind(null, node.id)}
                    title="Delete position?"
                    description={`This will remove "${node.title}" from the organization chart. Any positions reporting to it will become top-level.`}
                  />
                </div>
              </div>
            )}
          />
        </div>
      )}
    </main>
  );
}
