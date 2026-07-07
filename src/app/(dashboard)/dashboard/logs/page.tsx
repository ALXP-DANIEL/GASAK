import { DataTable } from "@components/shared/data-table";
import { activityLogs, db } from "@server/db";
import { desc } from "drizzle-orm";
import { requireDashboardRole } from "../_components/dashboard-section";
import { PageHeader } from "../_components/page-surface";
import { columns } from "./_components/columns";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  await requireDashboardRole("admin");

  const rows = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(150);

  const roleFilterOptions = Array.from(
    new Set(rows.map((row) => row.actorRole ?? "public")),
  ).map((value) => ({ value, label: value }));
  const actionFilterOptions = Array.from(
    new Set(rows.map((row) => row.action)),
  ).map((value) => ({ value, label: value }));

  return (
    <main>
      <PageHeader
        title="Logs"
        description="Audit trail for successful app operations across admin, seller, and squad users."
      />
      <DataTable
        columns={columns}
        data={rows}
        emptyMessage="No activity logged yet."
        searchColumnId="actor"
        searchPlaceholder="Search logs..."
        facetedFilters={[
          { columnId: "role", title: "Role", options: roleFilterOptions },
          {
            columnId: "action",
            title: "Action",
            options: actionFilterOptions,
          },
        ]}
      />
    </main>
  );
}
