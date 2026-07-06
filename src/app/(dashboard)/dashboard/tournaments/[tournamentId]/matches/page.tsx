import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { Badge } from "@components/ui/shadcn/badge";
import { Card, CardContent } from "@components/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/shadcn/table";
import { getTournament } from "@features/tournaments/queries";
import { formatDate } from "@lib/format";
import { db, scrims } from "@server/db";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardRole } from "../../../_components/dashboard-section";

export const dynamic = "force-dynamic";

export default async function TournamentMatchesPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  await requireDashboardRole();
  const { tournamentId } = await params;
  const tournament = await getTournament(tournamentId);
  if (!tournament) notFound();

  const rows = tournament.squadId
    ? await db.query.scrims.findMany({
        where: eq(scrims.squadId, tournament.squadId),
        orderBy: desc(scrims.date),
        with: { squad: true },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${tournament.name} — Matches`}
        description={`Match history for ${tournament.squad?.name ?? "this tournament's squad"}.`}
      />
      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No matches recorded for this squad.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opponent</TableHead>
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
    </div>
  );
}
