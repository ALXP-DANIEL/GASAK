import { notFound } from "next/navigation";
import { PageHeader } from "@/app/(dashboard)/dashboard/_components/page-surface";
import { listManagedTeamOptions } from "@/features/teams/queries";
import { TournamentForm } from "@/features/tournaments/components/tournament-form";
import { getTournament } from "@/features/tournaments/queries";
import { toDateTimeLocal } from "@/lib/format";
import { requireDashboardRole } from "../../../_components/dashboard-section";

export const dynamic = "force-dynamic";

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { user, role } = await requireDashboardRole(
    "admin",
    "leader",
    "member",
    "seller",
  );
  const { tournamentId } = await params;
  const [tournament, teams] = await Promise.all([
    getTournament(tournamentId),
    listManagedTeamOptions(role, user.id),
  ]);
  if (!tournament) notFound();
  if (!teams.some((team) => team.value === tournament.squadId)) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Edit Tournament" description={tournament.name} />
      <TournamentForm
        teams={teams}
        tournamentId={tournament.id}
        defaultValues={{
          name: tournament.name,
          organizer: tournament.organizer ?? "",
          date: toDateTimeLocal(tournament.date),
          prize: tournament.prize ?? "",
          opponent: tournament.opponent ?? "",
          result: tournament.result ?? "",
          mvp: tournament.mvp ?? "",
          squadId: tournament.squadId ?? "",
        }}
      />
    </div>
  );
}
