import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { DataTable } from "@components/shared/data-table";
import { listManagedSquadOptions } from "@features/squads/queries";
import { listTournaments } from "@features/tournaments/queries";
import { getMemberSquadIds } from "@server/authz";
import { requireDashboardRole } from "../_components/dashboard-section";
import { columns } from "./_components/columns";
import { TournamentFormDialog } from "./_components/tournament-form-dialog";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const { user, role } = await requireDashboardRole();
  const squadIds =
    role === "admin" ? undefined : await getMemberSquadIds(user.id);
  const [rows, squads] = await Promise.all([
    listTournaments(squadIds),
    listManagedSquadOptions(role, user.id),
  ]);
  const canManage = squads.length > 0;
  const squadFilterOptions = Array.from(
    new Set(rows.map((row) => row.squad?.name ?? "Unassigned")),
  ).map((value) => ({ value, label: value }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tournaments"
        description="Tournament records across your squads."
        actions={
          canManage ? <TournamentFormDialog squads={squads} /> : undefined
        }
      />
      <DataTable
        columns={columns}
        data={rows}
        emptyMessage="No tournaments recorded yet."
        searchColumnId="name"
        searchPlaceholder="Search tournaments..."
        facetedFilters={[
          { columnId: "squad", title: "Squad", options: squadFilterOptions },
        ]}
      />
    </div>
  );
}
