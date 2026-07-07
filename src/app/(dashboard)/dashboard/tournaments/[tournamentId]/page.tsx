import {
  DetailRow,
  PageHeader,
} from "@app/(dashboard)/dashboard/_components/page-surface";
import { DeleteButton } from "@components/shared/delete-button";
import { Badge } from "@components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { listManagedSquadOptions } from "@features/squads/queries";
import { deleteTournament } from "@features/tournaments/actions";
import { getTournament } from "@features/tournaments/queries";
import { formatDateTime } from "@lib/format";
import { canManageSquad } from "@server/authz";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireDashboardRole } from "../../_components/dashboard-section";
import { TournamentFormDialog } from "../_components/tournament-form-dialog";

export const dynamic = "force-dynamic";

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

  const [canManage, squads] = await Promise.all([
    canManageSquad(user.id, role, tournament.squadId),
    listManagedSquadOptions(role, user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tournament.name}
        description="Tournament record"
        actions={
          canManage ? (
            <>
              <TournamentFormDialog squads={squads} tournament={tournament} />
              <DeleteButton
                action={deleteTournament.bind(null, tournament.id)}
                title="Delete tournament?"
                description={`This will permanently remove "${tournament.name}".`}
                redirectTo="/dashboard/tournaments"
              />
            </>
          ) : undefined
        }
      />
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
          <DetailRow label="Organizer" value={tournament.organizer ?? "—"} />
          <DetailRow label="Prize" value={tournament.prize ?? "—"} />
          <DetailRow label="Opponent" value={tournament.opponent ?? "—"} />
          <DetailRow
            label="Result"
            value={
              tournament.result ? (
                <Badge variant="secondary">{tournament.result}</Badge>
              ) : (
                "—"
              )
            }
          />
          <DetailRow label="MVP" value={tournament.mvp ?? "—"} />
        </CardContent>
      </Card>
    </div>
  );
}
