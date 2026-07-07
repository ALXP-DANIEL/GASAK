import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { DataTable } from "@components/shared/data-table";
import { listSquads } from "@features/squads/queries";
import { requireDashboardRole } from "../_components/dashboard-section";
import { columns } from "./_components/columns";
import { SquadFormDialog } from "./_components/squad-form";

export const dynamic = "force-dynamic";

export default async function SquadsPage() {
  await requireDashboardRole("admin");
  const rows = await listSquads();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Squads" description="Rosters across the organization.">
        <SquadFormDialog />
      </PageHeader>
      <DataTable
        columns={columns}
        data={rows}
        emptyMessage="No squads yet."
        searchColumnId="name"
        searchPlaceholder="Search squads..."
        facetedFilters={[
          {
            columnId: "status",
            title: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "archived", label: "Archived" },
              { value: "recruiting", label: "Recruiting" },
            ],
          },
        ]}
      />
    </div>
  );
}
