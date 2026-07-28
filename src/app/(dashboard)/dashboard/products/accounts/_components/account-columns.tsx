"use client";

import { Badge } from "@components/ui/shadcn/badge";
import { buttonVariants } from "@components/ui/shadcn/button";
import { formatRM, formatWinRate } from "@lib/format";
import { formatRank } from "@lib/ranks";
import type { AccountProduct } from "@server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

/**
 * Account listings are one-of-a-kind, so this deliberately drops merch's
 * "Stock" column (meaningless for a single account) in favour of the stats a
 * seller actually scans for: rank, win rate, skin count, and sold state.
 */
export const accountColumns: ColumnDef<AccountProduct>[] = [
  {
    id: "name",
    accessorFn: (row) => row.name,
    header: "Listing",
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
    cell: ({ row }) => formatRM(row.original.priceSen),
  },
  {
    id: "rank",
    header: "Rank",
    cell: ({ row }) => formatRank(row.original.accountDetails?.rank),
  },
  {
    id: "winRate",
    header: "Win rate",
    cell: ({ row }) => formatWinRate(row.original.accountDetails?.winRate),
  },
  {
    id: "skins",
    header: "Skins",
    cell: ({ row }) => row.original.accountDetails?.skinCount ?? "—",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const product = row.original;
      // Sold outranks Hidden: it is the state a seller most needs to see.
      if (product.accountDetails?.sold)
        return <Badge variant="secondary">Sold</Badge>;
      return (
        <Badge variant={product.active ? "default" : "outline"}>
          {product.active ? "Available" : "Hidden"}
        </Badge>
      );
    },
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
