import {
  DetailRow,
  PageHeader,
} from "@app/(dashboard)/dashboard/_components/page-surface";
import { DeleteButton } from "@components/shared/delete-button";
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
import { listManagedSquadOptions } from "@features/squads/queries";
import {
  deleteTournament,
  deleteTournamentRound,
} from "@features/tournaments/actions";
import { getTournament } from "@features/tournaments/queries";
import { formatDateTime } from "@lib/format";
import {
  MATCH_OUTCOME_LABELS,
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_STATUS_LABELS,
} from "@lib/labels";
import { cn } from "@lib/utils";
import { canManageSquad } from "@server/authz";
import { db, events, type MatchOutcome } from "@server/db";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireDashboardRole } from "../../_components/dashboard-section";
import { TournamentFormDialog } from "../_components/tournament-form-dialog";
import { ChallongePanel } from "./_components/challonge-panel";
import { RoundFormDialog } from "./_components/round-form-dialog";

export const dynamic = "force-dynamic";

const outcomeVariant: Record<
  MatchOutcome,
  "default" | "secondary" | "outline" | "destructive"
> = {
  win: "default",
  loss: "destructive",
  draw: "secondary",
  pending: "outline",
};

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { user, role } = await requireDashboardRole();
  const { tournamentId } = await params;
  if (!z.uuid().safeParse(tournamentId).success) notFound();
  const tournament = await getTournament(tournamentId);
  if (!tournament) notFound();

  const [canManage, squads, squadEvents] = await Promise.all([
    canManageSquad(user.id, role, tournament.squadId),
    listManagedSquadOptions(role, user.id),
    tournament.squadId
      ? db.query.events.findMany({
          where: eq(events.squadId, tournament.squadId),
          orderBy: desc(events.startsAt),
          limit: 50,
        })
      : Promise.resolve([]),
  ]);

  const eventOptions = squadEvents.map((event) => ({
    value: event.id,
    label: `${event.title} · ${formatDateTime(event.startsAt)}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tournament.name}
        description="Tournament run"
        actions={
          canManage ? (
            <>
              <TournamentFormDialog squads={squads} tournament={tournament} />
              <DeleteButton
                action={deleteTournament.bind(null, tournament.id)}
                title="Delete tournament?"
                description={`This will permanently remove "${tournament.name}" and all its rounds.`}
                redirectTo="/dashboard/tournaments"
              />
            </>
          ) : undefined
        }
      />

      <div
        className={cn(
          "grid gap-6",
          tournament.tracking === "challonge" && "desktop:grid-cols-2",
        )}
      >
        <Card>
          <CardHeader>
            <CardTitle>Tournament details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <DetailRow
              label="Squad"
              value={tournament.squad?.name ?? "Unassigned"}
            />
            <DetailRow label="Date" value={formatDateTime(tournament.date)} />
            <DetailRow
              label="Format"
              value={TOURNAMENT_FORMAT_LABELS[tournament.format]}
            />
            <DetailRow
              label="Status"
              value={
                <Badge variant="secondary">
                  {TOURNAMENT_STATUS_LABELS[tournament.status]}
                </Badge>
              }
            />
            <DetailRow
              label="Tracking"
              value={
                tournament.tracking === "challonge" ? "Challonge" : "Manual"
              }
            />
            <DetailRow label="Organizer" value={tournament.organizer ?? "—"} />
            <DetailRow label="Prize" value={tournament.prize ?? "—"} />
            <DetailRow
              label="Placement"
              value={
                tournament.placement ? (
                  <Badge variant="secondary">{tournament.placement}</Badge>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow label="MVP" value={tournament.mvp ?? "—"} />
          </CardContent>
        </Card>

        {canManage && tournament.tracking === "challonge" && (
          <ChallongePanel tournament={tournament} />
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="grid gap-1.5">
            <CardTitle>Rounds</CardTitle>
            <CardDescription>
              Our path through the bracket, round by round.
            </CardDescription>
          </div>
          {canManage && (
            <RoundFormDialog
              tournamentId={tournament.id}
              events={eventOptions}
            />
          )}
        </CardHeader>
        <CardContent>
          {tournament.rounds.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No rounds logged yet
              {canManage
                ? tournament.tracking === "challonge"
                  ? " — add one or sync from Challonge."
                  : " — add one to get started."
                : "."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Opponent</TableHead>
                  <TableHead>Played At</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Event</TableHead>
                  {canManage && <TableHead className="w-0" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournament.rounds.map((round) => (
                  <TableRow key={round.id}>
                    <TableCell className="font-medium">
                      {round.roundLabel}
                    </TableCell>
                    <TableCell>vs {round.opponent}</TableCell>
                    <TableCell>
                      {round.scheduledAt
                        ? formatDateTime(round.scheduledAt)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={outcomeVariant[round.outcome]}>
                        {MATCH_OUTCOME_LABELS[round.outcome]}
                      </Badge>
                    </TableCell>
                    <TableCell>{round.score ?? "—"}</TableCell>
                    <TableCell>
                      {round.event ? (
                        <Link
                          href={`/dashboard/schedules/${round.event.id}`}
                          className="underline underline-offset-4 hover:text-primary"
                        >
                          {round.event.title}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <RoundFormDialog
                            tournamentId={tournament.id}
                            round={round}
                            events={eventOptions}
                          />
                          <DeleteButton
                            action={deleteTournamentRound.bind(null, round.id)}
                            title="Delete round?"
                            description={`This will remove "${round.roundLabel}" vs ${round.opponent}.`}
                          />
                        </div>
                      </TableCell>
                    )}
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
