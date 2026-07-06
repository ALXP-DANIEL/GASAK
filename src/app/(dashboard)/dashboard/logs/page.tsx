import { desc } from "drizzle-orm";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { activityLogs, db } from "@/server/db";
import { requireDashboardRole } from "../_components/dashboard-section";
import { EmptyState, PageHeader } from "../_components/page-surface";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-MY", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function LogsPage() {
  await requireDashboardRole("admin");

  const rows = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(150);

  return (
    <main>
      <PageHeader
        title="Logs"
        description="Audit trail for successful app operations across admin, seller, and squad users."
      />

      {rows.length === 0 ? (
        <EmptyState message="No activity logged yet." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">
                    {dateFormatter.format(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="grid gap-0.5">
                      <span className="font-medium">
                        {log.actorName ?? "System"}
                      </span>
                      {log.actorEmail && (
                        <span className="text-muted-foreground">
                          {log.actorEmail}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.actorRole ? (
                      <Badge variant="outline">{log.actorRole}</Badge>
                    ) : (
                      <span className="text-muted-foreground">public</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>
                    <div className="grid gap-0.5">
                      <span>{log.entityType}</span>
                      {log.entityId && (
                        <span className="max-w-32 truncate text-muted-foreground">
                          {log.entityId}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-80 whitespace-normal">
                    {log.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
