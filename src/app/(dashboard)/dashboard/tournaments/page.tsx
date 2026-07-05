import Link from "next/link";
import { PageHeader } from "@/app/(dashboard)/dashboard/_components/page-surface";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent } from "@/components/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { listManagedTeamOptions } from "@/features/teams/queries";
import { listTournaments } from "@/features/tournaments/queries";
import { formatDate } from "@/lib/format";
import { getMemberSquadIds } from "@/server/authz";
import { requireDashboardRole } from "../_components/dashboard-section";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const { user, role } = await requireDashboardRole(
    "admin",
    "leader",
    "member",
    "seller",
  );
  const squadIds =
    role === "admin" ? undefined : await getMemberSquadIds(user.id);
  const [rows, teams] = await Promise.all([
    listTournaments(squadIds),
    listManagedTeamOptions(role, user.id),
  ]);
  const canManage = teams.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tournaments"
        description="Tournament records across your squads."
        actions={
          canManage ? (
            <Button asChild>
              <Link href="/dashboard/tournaments/new">New Tournament</Link>
            </Button>
          ) : undefined
        }
      />
      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No tournaments recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Squad</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Opponent</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((tournament) => (
                  <TableRow key={tournament.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/tournaments/${tournament.id}`}
                        className="font-medium hover:underline"
                      >
                        {tournament.name}
                      </Link>
                    </TableCell>
                    <TableCell>{tournament.squad?.name ?? "—"}</TableCell>
                    <TableCell>{formatDate(tournament.date)}</TableCell>
                    <TableCell>{tournament.opponent ?? "—"}</TableCell>
                    <TableCell>
                      {tournament.result ? (
                        <Badge variant="secondary">{tournament.result}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
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
