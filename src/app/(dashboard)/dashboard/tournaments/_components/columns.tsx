"use client";

import { Badge } from "@components/ui/shadcn/badge";
import type { listTournaments } from "@features/tournaments/queries";
import { formatDate } from "@lib/format";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

type TournamentRow = Awaited<ReturnType<typeof listTournaments>>[number];

export const columns: ColumnDef<TournamentRow>[] = [
  {
    id: "name",
    accessorFn: (row) => `${row.name} ${row.opponent ?? ""}`,
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
    id: "opponent",
    header: "Opponent",
    cell: ({ row }) => row.original.opponent ?? "—",
  },
  {
    id: "result",
    header: "Result",
    cell: ({ row }) =>
      row.original.result ? (
        <Badge variant="secondary">{row.original.result}</Badge>
      ) : (
        "—"
      ),
  },
];
