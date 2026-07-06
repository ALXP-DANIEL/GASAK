import { notFound } from "next/navigation";
import { PageHeader } from "@/app/(dashboard)/dashboard/_components/page-surface";
import { Badge } from "@/components/ui/shadcn/badge";
import { Card, CardContent } from "@/components/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { getSquad } from "@/features/squads/queries";
import { formatDate } from "@/lib/format";
import { LANE_LABELS, SQUAD_ROLE_LABELS } from "@/lib/labels";
import { requireDashboardRole } from "../../_components/dashboard-section";

export const dynamic = "force-dynamic";

export default async function SquadDetailPage({
  params,
}: {
  params: Promise<{ squadId: string }>;
}) {
  await requireDashboardRole("admin");
  const { squadId } = await params;
  const squad = await getSquad(squadId);
  if (!squad) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={squad.name}
        description={squad.description ?? "Squad roster and details."}
        actions={
          squad.archived ? <Badge variant="outline">Archived</Badge> : undefined
        }
      />
      <Card>
        <CardContent>
          {squad.members.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No members in this squad yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>IGN</TableHead>
                  <TableHead>Lane</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {squad.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user.name}
                    </TableCell>
                    <TableCell>{member.user.profile?.ign ?? "—"}</TableCell>
                    <TableCell>
                      {member.user.profile?.preferredLane
                        ? LANE_LABELS[member.user.profile.preferredLane]
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {SQUAD_ROLE_LABELS[member.squadRole]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(member.joinedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
