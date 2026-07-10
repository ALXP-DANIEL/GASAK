"use client";

import { DataTable } from "@components/shared/data-table";
import { EntityListCard } from "@components/shared/entity-list-card";
import { Badge } from "@components/ui/shadcn/badge";
import { formatDistanceToNow } from "date-fns";
import { columns, type LogRow } from "./columns";

export function LogsTable({
  rows,
  roleFilterOptions,
  actionFilterOptions,
}: {
  rows: LogRow[];
  roleFilterOptions: { value: string; label: string }[];
  actionFilterOptions: { value: string; label: string }[];
}) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage="No activity logged yet."
      searchColumnId="actor"
      searchPlaceholder="Search logs..."
      facetedFilters={[
        { columnId: "role", title: "Role", options: roleFilterOptions },
        { columnId: "action", title: "Action", options: actionFilterOptions },
      ]}
      renderMobileCard={(log) => (
        <EntityListCard
          title={log.description}
          meta={`${log.actorName ?? "System"} · ${formatDistanceToNow(log.createdAt, { addSuffix: true })}`}
          trailing={<Badge variant="outline">{log.action}</Badge>}
        />
      )}
    />
  );
}
