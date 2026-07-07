"use client";

import { Badge } from "@components/ui/shadcn/badge";
import type { listSquads } from "@features/squads/queries";
import { formatDate } from "@lib/format";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

type SquadRow = Awaited<ReturnType<typeof listSquads>>[number];

export const columns: ColumnDef<SquadRow>[] = [
  {
    id: "name",
    accessorFn: (row) => row.squad.name,
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/squads/${row.original.squad.id}`}
        className="font-medium hover:underline"
      >
        {row.original.squad.name}
      </Link>
    ),
  },
  {
    id: "memberCount",
    header: "Members",
    cell: ({ row }) => row.original.memberCount,
  },
  {
    id: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.squad.createdAt),
  },
  {
    id: "status",
    accessorFn: (row) => [
      row.squad.archived ? "archived" : "active",
      ...(row.squad.recruiting ? ["recruiting"] : []),
    ],
    filterFn: "arrIncludesSome",
    header: "Status",
    cell: ({ row }) => {
      const { squad } = row.original;
      return (
        <div className="flex flex-wrap gap-2">
          <Badge variant={squad.archived ? "outline" : "secondary"}>
            {squad.archived ? "Archived" : "Active"}
          </Badge>
          {squad.recruiting && <Badge variant="default">Recruiting</Badge>}
        </div>
      );
    },
  },
];
