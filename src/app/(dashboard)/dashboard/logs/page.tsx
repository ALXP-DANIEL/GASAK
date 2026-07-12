import { Icons } from "@components/icons";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { activityLogs, db } from "@server/db";
import { desc } from "drizzle-orm";
import { requireDashboardRole } from "../_components/dashboard-section";
import { PageHeader } from "../_components/page-surface";
import { LogsTable } from "./_components/logs-table";

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
        kicker="System"
        icon={Icons.Domain.Audit}
        description="Audit trail for successful app operations across admin, seller, and squad users."
      />
      <div className="flex flex-col gap-6">
        <StatStrip>
          <StatItem
            label="Entries"
            value={rows.length}
            hint="Most recent operations"
            icon={Icons.Domain.Reports}
          />
          <StatItem
            label="Actions"
            value={actionFilterOptions.length}
            hint="Distinct operation types"
            icon={Icons.Domain.Lightning}
          />
          <StatItem
            label="Actor Roles"
            value={roleFilterOptions.length}
            hint="Roles that acted"
            icon={Icons.Domain.Members}
          />
        </StatStrip>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 border border-b-0 bg-foreground/90 px-4 py-2 dark:bg-muted/60">
            <span aria-hidden className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-destructive/80" />
              <span className="size-2.5 rounded-full bg-amber-500/80" />
              <span className="size-2.5 rounded-full bg-emerald-500/80" />
            </span>
            <span className="ml-2 font-mono text-xs text-background dark:text-foreground">
              gasak — audit.log
            </span>
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-background/70 dark:text-muted-foreground">
              <span
                aria-hidden
                className="size-1.5 animate-pulse rounded-full bg-emerald-500"
              />
              recording
            </span>
          </div>
          <div className="border border-t-0 p-3">
            <LogsTable
              rows={rows}
              roleFilterOptions={roleFilterOptions}
              actionFilterOptions={actionFilterOptions}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
