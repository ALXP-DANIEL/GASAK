"use client";

import { DataTable } from "@components/shared/data-table";
import { EntityListCard } from "@components/shared/entity-list-card";
import { Badge } from "@components/ui/shadcn/badge";
import { formatDateTime, formatRM } from "@lib/format";
import { ORDER_STATUS_LABELS } from "@lib/labels";
import type { Order, Product } from "@server/db/schema";
import { columns } from "./columns";
import { OrderRowActions } from "./order-row-actions";

type OrderRow = Order & { product: Product };

export function OrdersTable({
  rows,
  emptyMessage,
  statusOptions,
}: {
  rows: OrderRow[];
  emptyMessage: string;
  statusOptions: { value: string; label: string }[];
}) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage={emptyMessage}
      searchColumnId="orderNo"
      searchPlaceholder="Search order no, customer..."
      facetedFilters={[
        { columnId: "status", title: "Status", options: statusOptions },
      ]}
      renderMobileCard={(order) => (
        <EntityListCard
          title={order.orderNo}
          meta={`${order.customerName} · ${order.product.name} × ${order.quantity} · ${formatDateTime(order.createdAt)}`}
          trailing={
            <Badge
              variant={
                order.status === "cancelled"
                  ? "destructive"
                  : order.status === "completed"
                    ? "default"
                    : "outline"
              }
            >
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          }
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium tabular-nums">
              {formatRM(order.totalSen)}
            </span>
            <OrderRowActions order={order} />
          </div>
        </EntityListCard>
      )}
    />
  );
}
