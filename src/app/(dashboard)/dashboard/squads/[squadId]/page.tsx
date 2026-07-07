import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { Badge } from "@components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { getSquad } from "@features/squads/queries";
import { canManageSquad } from "@server/authz";
import { db } from "@server/db";
import { requireUser, userOrgRole } from "@server/session";
import { forbidden, notFound } from "next/navigation";
import {
  AddSquadMemberDialog,
  SquadArchiveButton,
  SquadDeleteButton,
  SquadEditDialog,
  SquadRosterTable,
} from "../_components/squad-manage";

export const dynamic = "force-dynamic";

export default async function SquadDetailPage({
  params,
}: {
  params: Promise<{ squadId: string }>;
}) {
  const actor = await requireUser();
  const role = userOrgRole(actor);
  const { squadId } = await params;

  const squad = await getSquad(squadId);
  if (!squad) notFound();

  const isAdmin = role === "admin";
  const canManage = isAdmin || (await canManageSquad(actor.id, role, squadId));
  if (!canManage) forbidden();

  const candidates = canManage
    ? (
        await db.query.user.findMany({
          orderBy: (t, { asc }) => asc(t.name),
          with: { memberships: true },
        })
      )
        .filter((u) => u.memberships.length === 0)
        .map((u) => ({ id: u.id, name: u.name, email: u.email }))
    : [];

  return (
    <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-6">
        <PageHeader
          title={squad.name}
          description={squad.description ?? "Squad roster and details."}
          actions={
            squad.archived ? (
              <Badge variant="outline">Archived</Badge>
            ) : undefined
          }
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Roster</CardTitle>
            {canManage && (
              <AddSquadMemberDialog
                squadId={squad.id}
                candidates={candidates}
              />
            )}
          </CardHeader>
          <CardContent>
            <SquadRosterTable members={squad.members} canManage={canManage} />
          </CardContent>
        </Card>
      </div>

      <div className="grid h-fit gap-4">
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>Manage squad</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <SquadEditDialog squad={squad} />
            {isAdmin && (
              <>
                <SquadArchiveButton
                  squadId={squad.id}
                  archived={squad.archived}
                />
                <SquadDeleteButton squadId={squad.id} squadName={squad.name} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
