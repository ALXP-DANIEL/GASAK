import { activityLogs, db } from "@server/db";
import { desc } from "drizzle-orm";
import { requireDashboardRole } from "../_components/dashboard-section";
import { PageHeader } from "../_components/page-surface";
import { LogsTable } from "./_components/logs-table";

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
      <LogsTable
        rows={rows}
        roleFilterOptions={roleFilterOptions}
        actionFilterOptions={actionFilterOptions}
      />
    </main>
  );
}
