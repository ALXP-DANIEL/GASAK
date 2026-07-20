"use client";

import { Badge } from "@components/ui/shadcn/badge";
import { formatDateTime, formatRM } from "@lib/format";
import { ORDER_STATUS_LABELS } from "@lib/labels";
import type { Order, Product } from "@server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import { OrderRowActions } from "./order-row-actions";

type OrderRow = Order & { product: Product };

export const columns: ColumnDef<OrderRow>[] = [
  {
    id: "orderNo",
    accessorFn: (row) =>
      `${row.orderNo} ${row.customerName} ${row.customerEmail} ${row.customerPhone} ${row.product.name}`,
    header: "Order",
    cell: ({ row }) => (
      <div className="grid gap-0.5">
        <span className="font-medium">{row.original.orderNo}</span>
        <span className="text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      </div>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <div className="grid gap-0.5">
        <span>{row.original.customerName}</span>
        <span className="text-muted-foreground">
          {row.original.customerPhone}
        </span>
      </div>
    ),
  },
  {
    id: "product",
    header: "Product",
    cell: ({ row }) => (
      <div className="grid gap-0.5">
        <span>{`${row.original.product.name} x ${row.original.quantity}`}</span>
        {row.original.variantLabel && (
          <span className="text-muted-foreground">
            {row.original.variantLabel}
          </span>
        )}
      </div>
    ),
  },
  {
    id: "total",
    header: "Total",
    cell: ({ row }) => formatRM(row.original.totalSen),
  },
  {
    id: "status",
    accessorFn: (row) => row.status,
    filterFn: "arrIncludesSome",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.status === "cancelled"
            ? "destructive"
            : row.original.status === "completed"
              ? "default"
              : "outline"
        }
      >
        {ORDER_STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <OrderRowActions order={row.original} />,
  },
];
