import { Icons } from "@components/icons";
import { buildOrgTree, OrgChart } from "@components/org-chart/org-chart";
import { OrgChartPanZoom } from "@components/org-chart/org-chart-pan-zoom";
import { DeleteButton } from "@components/shared/delete-button";
import { PageSkeleton } from "@components/shared/page-skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/shadcn/avatar";
import { initials } from "@lib/format";
import { deleteOrganizationPosition } from "@server/actions/organization";
import { db } from "@server/db";
import { requireDashboardRole } from "../_components/dashboard-section";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { OrganizationPositionFormDialog } from "./_components/organization-form";

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
    <PageSkeleton name="organization" loading={false}>
      <main>
        <PageHeader
          title="Organization"
          kicker="System"
          icon={Icons.Domain.Hierarchy}
          description="Manage the public organization chart — hierarchy, titles, and who holds them."
        >
          <OrganizationPositionFormDialog
            candidateUsers={candidateUsers}
            allPositions={allPositions}
          />
        </PageHeader>

        {tree.length === 0 ? (
          <EmptyState
            message="No positions yet. Add your first position."
            icon={Icons.Domain.Members}
          />
        ) : (
          <OrgChartPanZoom>
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
                  <div className="flex items-center gap-2 border-t border-border/70 pt-2">
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
          </OrgChartPanZoom>
        )}
      </main>
    </PageSkeleton>
  );
}
