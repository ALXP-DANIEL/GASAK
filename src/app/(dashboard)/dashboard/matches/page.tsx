import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { DataTable } from "@components/shared/data-table";
import { listMatches } from "@features/matches/queries";
import { listManagedSquadOptions } from "@features/squads/queries";
import { getMemberSquadIds } from "@server/authz";
import { requireDashboardRole } from "../_components/dashboard-section";
import { columns } from "./_components/columns";
import { MatchFormDialog } from "./_components/match-form-dialog";

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
  const squadFilterOptions = Array.from(
    new Set(rows.map((row) => row.squad.name)),
  ).map((value) => ({ value, label: value }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Matches"
        description="Scrim and match records for your squads."
        actions={canManage ? <MatchFormDialog squads={squads} /> : undefined}
      />
      <DataTable
        columns={columns}
        data={rows}
        emptyMessage="No matches recorded yet."
        searchColumnId="opponent"
        searchPlaceholder="Search opponent or squad..."
        facetedFilters={[
          { columnId: "squad", title: "Squad", options: squadFilterOptions },
        ]}
      />
    </div>
  );
}
