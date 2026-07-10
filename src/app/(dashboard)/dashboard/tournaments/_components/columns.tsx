"use client";

import { Badge } from "@components/ui/shadcn/badge";
import type { listTournaments } from "@features/tournaments/queries";
import { formatDate } from "@lib/format";
import {
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_STATUS_LABELS,
} from "@lib/labels";
import type { TournamentStatus } from "@server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

type TournamentRow = Awaited<ReturnType<typeof listTournaments>>[number];

const statusVariant: Record<
  TournamentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  upcoming: "outline",
  ongoing: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export const columns: ColumnDef<TournamentRow>[] = [
  {
    id: "name",
    accessorFn: (row) => row.name,
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/tournaments/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "squad",
    accessorFn: (row) => row.squad?.name ?? "Unassigned",
    filterFn: "arrIncludesSome",
    header: "Squad",
    cell: ({ row }) => row.original.squad?.name ?? "—",
  },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    id: "format",
    header: "Format",
    cell: ({ row }) => TOURNAMENT_FORMAT_LABELS[row.original.format],
  },
  {
    id: "status",
    accessorFn: (row) => TOURNAMENT_STATUS_LABELS[row.status],
    filterFn: "arrIncludesSome",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>
        {TOURNAMENT_STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    id: "placement",
    header: "Placement",
    cell: ({ row }) =>
      row.original.placement ? (
        <Badge variant="secondary">{row.original.placement}</Badge>
      ) : (
        "—"
      ),
  },
];
