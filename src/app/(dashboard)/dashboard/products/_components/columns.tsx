"use client";

import { Badge } from "@components/ui/shadcn/badge";
import { PRODUCT_CATEGORY_LABELS } from "@lib/labels";
import type { Product } from "@server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ProductFormDialog } from "./product-form";

export const columns: ColumnDef<Product>[] = [
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
    id: "category",
    accessorFn: (row) => row.category,
    filterFn: "arrIncludesSome",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {PRODUCT_CATEGORY_LABELS[row.original.category]}
      </Badge>
    ),
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
        <ProductFormDialog product={row.original} />
      </div>
    ),
  },
];
