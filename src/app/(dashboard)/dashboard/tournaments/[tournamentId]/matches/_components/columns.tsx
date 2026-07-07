"use client";

import { Badge } from "@components/ui/shadcn/badge";
import { formatDate } from "@lib/format";
import type { scrims } from "@server/db";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

type MatchRow = typeof scrims.$inferSelect;

export const columns: ColumnDef<MatchRow>[] = [
  {
    id: "opponent",
    accessorFn: (row) => row.opponent,
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
    id: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.date),
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
