import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { DataTable } from "@components/shared/data-table";
import { listPlayers } from "@features/players/queries";
import { LANE_LABELS } from "@lib/labels";
import { laneEnum } from "@server/db/schema";
import { requireDashboardRole } from "../_components/dashboard-section";
import { columns } from "./_components/columns";

export const dynamic = "force-dynamic";

const laneFilterOptions = laneEnum.enumValues.map((value) => ({
  value,
  label: LANE_LABELS[value],
}));

export default async function PlayersPage() {
  await requireDashboardRole("admin");
  const rows = await listPlayers();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Players" description="Registered player profiles." />
      <DataTable
        columns={columns}
        data={rows}
        emptyMessage="No player profiles yet."
        searchColumnId="name"
        searchPlaceholder="Search by name or IGN..."
        facetedFilters={[
          { columnId: "lane", title: "Lane", options: laneFilterOptions },
        ]}
      />
    </div>
  );
}
