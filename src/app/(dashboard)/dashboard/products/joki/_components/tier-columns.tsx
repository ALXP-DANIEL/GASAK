"use client";

import { DeleteButton } from "@components/shared/delete-button";
import { Badge } from "@components/ui/shadcn/badge";
import { formatRM } from "@lib/format";
import { deleteJokiTier } from "@server/actions/joki";
import type { JokiTier } from "@server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import { TierFormDialog } from "./tier-form";

export function buildTierColumns(allNames: string[]): ColumnDef<JokiTier>[] {
  return [
    {
      id: "name",
      accessorFn: (row) => row.name,
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      id: "pricePerStarSen",
      header: "Price per star",
      cell: ({ row }) => formatRM(row.original.pricePerStarSen),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.active ? "default" : "outline"}>
          {row.original.active ? "Active" : "Hidden"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <TierFormDialog tier={row.original} configuredNames={allNames} />
          <DeleteButton
            action={() => deleteJokiTier(row.original.id)}
            title="Delete this tier?"
            description={`"${row.original.name}" will be removed from the public pricelist.`}
          />
        </div>
      ),
    },
  ];
}
