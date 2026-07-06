import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { Badge } from "@components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/shadcn/table";
import { MatchForm } from "@features/matches/components/match-form";
import { listMatches } from "@features/matches/queries";
import { listManagedSquadOptions } from "@features/squads/queries";
import { formatDate } from "@lib/format";
import { getMemberSquadIds } from "@server/authz";
import Link from "next/link";
import { requireDashboardRole } from "../_components/dashboard-section";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const { user, role } = await requireDashboardRole();
  const squadIds =
    role === "admin" ? undefined : await getMemberSquadIds(user.id);
  const [rows, squads] = await Promise.all([
    listMatches(squadIds),
    listManagedSquadOptions(role, user.id),
  ]);
  const canManage = squads.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Matches"
        description="Scrim and match records for your squads."
      />
      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No matches recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opponent</TableHead>
                  <TableHead>Squad</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/matches/${match.id}`}
                        className="font-medium hover:underline"
                      >
                        vs {match.opponent}
                      </Link>
                    </TableCell>
                    <TableCell>{match.squad.name}</TableCell>
                    <TableCell>{formatDate(match.date)}</TableCell>
                    <TableCell>
                      {match.result ? (
                        <Badge variant="secondary">{match.result}</Badge>
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

      {canManage && squads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Record Match</CardTitle>
            <CardDescription>
              Log a scrim or match result for your squad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MatchForm squads={squads} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
