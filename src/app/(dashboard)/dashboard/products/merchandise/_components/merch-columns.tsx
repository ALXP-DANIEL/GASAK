"use client";

import { Badge } from "@components/ui/shadcn/badge";
import { buttonVariants } from "@components/ui/shadcn/button";
import { formatRM } from "@lib/format";
import type { Product } from "@server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

export const merchColumns: ColumnDef<Product>[] = [
  {
    id: "name",
    accessorFn: (row) => row.name,
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/products/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "price",
    header: "Price",
    cell: ({ row }) =>
      row.original.hasVariants
        ? `from ${formatRM(row.original.priceSen)}`
        : formatRM(row.original.priceSen),
  },
  {
    id: "stock",
    header: "Stock",
    cell: ({ row }) => row.original.stock,
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
      <div className="flex justify-end">
        <Link
          href={`/dashboard/products/${row.original.id}/edit`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Edit
        </Link>
      </div>
    ),
  },
];
