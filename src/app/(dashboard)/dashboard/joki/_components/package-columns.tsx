"use client";

import { DeleteButton } from "@components/shared/delete-button";
import { Badge } from "@components/ui/shadcn/badge";
import { formatRM } from "@lib/format";
import { deleteJokiPackage } from "@server/actions/joki";
import type { JokiPackage, JokiTier } from "@server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import { PackageFormDialog } from "./package-form";

export function buildPackageColumns(
  tiers: JokiTier[],
): ColumnDef<JokiPackage>[] {
  const tierName = (id: string | null) =>
    tiers.find((t) => t.id === id)?.name ?? "—";

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
      id: "range",
      header: "Range",
      cell: ({ row }) =>
        `${tierName(row.original.fromTierId)} → ${tierName(row.original.toTierId)}`,
    },
    {
      id: "priceSen",
      header: "Price",
      cell: ({ row }) => formatRM(row.original.priceSen),
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
          <PackageFormDialog pkg={row.original} tiers={tiers} />
          <DeleteButton
            action={() => deleteJokiPackage(row.original.id)}
            title="Delete this package?"
            description={`"${row.original.name}" will be removed from the public pricelist.`}
          />
        </div>
      ),
    },
  ];
}
