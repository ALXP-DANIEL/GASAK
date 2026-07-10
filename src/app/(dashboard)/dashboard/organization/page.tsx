import {
  buildOrgTree,
  OrgChart,
  type OrgTreeNode,
} from "@components/org-chart/org-chart";
import { DeleteButton } from "@components/shared/delete-button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/shadcn/avatar";
import { initials } from "@lib/format";
import { deleteOrganizationPosition } from "@server/actions/organization";
import { db } from "@server/db";
import type { OrganizationPosition, User } from "@server/db/schema";
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
        <>
          {/* Mobile: indented tree list */}
          <div className="flex flex-col gap-2 desktop:hidden">
            <OrgTreeList
              nodes={tree}
              candidateUsers={candidateUsers}
              allPositions={allPositions}
            />
          </div>

          {/* Desktop: full org chart */}
          <div className="overflow-x-auto mobile:hidden">
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
          </div>
        </>
      )}
    </main>
  );
}

type PositionNode = OrgTreeNode<OrganizationPosition & { user: User | null }>;

function OrgTreeList({
  nodes,
  candidateUsers,
  allPositions,
  depth = 0,
}: {
  nodes: PositionNode[];
  candidateUsers: Parameters<
    typeof OrganizationPositionFormDialog
  >[0]["candidateUsers"];
  allPositions: { id: string; title: string; parentId: string | null }[];
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node) => (
        <div key={node.id} className={depth > 0 ? "border-l pl-3" : undefined}>
          <div className="flex items-center gap-3 border bg-card px-3 py-2.5 shadow-xs">
            <Avatar className="size-9">
              <AvatarImage
                src={node.user?.image ?? undefined}
                alt={node.user?.name ?? node.title}
              />
              <AvatarFallback>
                {node.user ? initials(node.user.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{node.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {node.user?.name ?? "Vacant"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
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
          {node.children.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <OrgTreeList
                nodes={node.children}
                candidateUsers={candidateUsers}
                allPositions={allPositions}
                depth={depth + 1}
              />
            </div>
          )}
        </div>
      ))}
    </>
  );
}
