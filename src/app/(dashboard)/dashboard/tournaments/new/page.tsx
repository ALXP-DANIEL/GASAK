import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { listManagedSquadOptions } from "@features/squads/queries";
import { TournamentForm } from "@features/tournaments/components/tournament-form";
import { requireDashboardRole } from "../../_components/dashboard-section";

export const dynamic = "force-dynamic";

export default async function NewTournamentPage() {
  const { user, role } = await requireDashboardRole();
  const squads = await listManagedSquadOptions(role, user.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New Tournament"
        description="Record a tournament for one of your squads."
      />
      {squads.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You have no squads to record tournaments for.
        </p>
      ) : (
        <TournamentForm squads={squads} />
      )}
    </div>
  );
}
