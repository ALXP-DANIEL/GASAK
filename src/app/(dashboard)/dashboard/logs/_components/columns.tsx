"use client";

import { Badge } from "@components/ui/shadcn/badge";
import type { activityLogs } from "@server/db";
import type { ColumnDef } from "@tanstack/react-table";

type LogRow = typeof activityLogs.$inferSelect;

const dateFormatter = new Intl.DateTimeFormat("en-MY", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const columns: ColumnDef<LogRow>[] = [
  {
    id: "time",
    header: "Time",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {dateFormatter.format(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actor",
    accessorFn: (row) =>
      `${row.actorName ?? ""} ${row.actorEmail ?? ""} ${row.action} ${row.entityType} ${row.description}`,
    header: "Actor",
    cell: ({ row }) => (
      <div className="grid gap-0.5">
        <span className="font-medium">
          {row.original.actorName ?? "System"}
        </span>
        {row.original.actorEmail && (
          <span className="text-muted-foreground">
            {row.original.actorEmail}
          </span>
        )}
      </div>
    ),
  },
  {
    id: "role",
    accessorFn: (row) => row.actorRole ?? "public",
    filterFn: "arrIncludesSome",
    header: "Role",
    cell: ({ row }) =>
      row.original.actorRole ? (
        <Badge variant="outline">{row.original.actorRole}</Badge>
      ) : (
        <span className="text-muted-foreground">public</span>
      ),
  },
  {
    id: "action",
    accessorFn: (row) => row.action,
    filterFn: "arrIncludesSome",
    header: "Action",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.action}</span>
    ),
  },
  {
    id: "target",
    header: "Target",
    cell: ({ row }) => (
      <div className="grid gap-0.5">
        <span>{row.original.entityType}</span>
        {row.original.entityId && (
          <span className="max-w-32 truncate text-muted-foreground">
            {row.original.entityId}
          </span>
        )}
      </div>
    ),
  },
  {
    id: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="min-w-80 whitespace-normal block">
        {row.original.description}
      </span>
    ),
  },
];
