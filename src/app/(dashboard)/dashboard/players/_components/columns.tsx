"use client";

import type { listPlayers } from "@features/players/queries";
import { formatLanes } from "@lib/labels";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

type PlayerRow = Awaited<ReturnType<typeof listPlayers>>[number];

export const columns: ColumnDef<PlayerRow>[] = [
  {
    id: "name",
    accessorFn: (row) => `${row.user.name} ${row.ign ?? ""}`,
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/players/${row.original.userId}`}
        className="font-medium hover:underline"
      >
        {row.original.user.name}
      </Link>
    ),
  },
  {
    id: "ign",
    header: "IGN",
    cell: ({ row }) => row.original.ign ?? "—",
  },
  {
    id: "lane",
    accessorFn: (row) => row.preferredLanes ?? [],
    filterFn: "arrIncludesSome",
    header: "Lane",
    cell: ({ row }) => formatLanes(row.original.preferredLanes),
  },
  {
    id: "rank",
    header: "Rank",
    cell: ({ row }) => row.original.currentRank ?? "—",
  },
];
