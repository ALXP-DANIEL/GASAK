"use client";

import { Badge } from "@components/ui/shadcn/badge";
import type { listMatches } from "@features/matches/queries";
import { formatDate } from "@lib/format";
import { resultBadgeVariant } from "@lib/labels";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

type MatchRow = Awaited<ReturnType<typeof listMatches>>[number];

export const columns: ColumnDef<MatchRow>[] = [
  {
    id: "opponent",
    accessorFn: (row) => `${row.opponent} ${row.squad.name}`,
    header: "Opponent",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/matches/${row.original.id}`}
        className="font-medium hover:underline"
      >
        vs {row.original.opponent}
      </Link>
    ),
  },
  {
    id: "squad",
    accessorFn: (row) => row.squad.name,
    filterFn: "arrIncludesSome",
    header: "Squad",
    cell: ({ row }) => row.original.squad.name,
  },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    id: "result",
    header: "Result",
    cell: ({ row }) =>
      row.original.result ? (
        <Badge variant={resultBadgeVariant(row.original.result)}>
          {row.original.result}
        </Badge>
      ) : (
        <Badge variant="outline">No result</Badge>
      ),
  },
];
