import { SegmentedBar } from "@components/charts/segmented-bar";
import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/shadcn/tabs";
import { formatRM } from "@lib/format";
import { ORDER_STATUS_LABELS } from "@lib/labels";
import { db, orders } from "@server/db";
import { requireOrgRole } from "@server/session";
import { desc } from "drizzle-orm";
import { PageHeader } from "../_components/page-surface";
import { OrdersTable } from "./_components/orders-table";

function statusFilterOptions(statuses: (keyof typeof ORDER_STATUS_LABELS)[]) {
  return statuses.map((value) => ({
    value,
    label: ORDER_STATUS_LABELS[value],
  }));
}

export default async function OrdersPage() {
  await requireOrgRole("admin", "seller");

  const rows = await db.query.orders.findMany({
    orderBy: desc(orders.createdAt),
    with: { product: true },
  });

  const needsAction = rows.filter(
    (order) => order.status === "pending" || order.status === "waiting_payment",
  );
  const inProgress = rows.filter(
    (order) => order.status === "paid" || order.status === "processing",
  );
  const done = rows.filter(
    (order) => order.status === "completed" || order.status === "cancelled",
  );

  const paidRevenue = rows
    .filter((order) =>
      ["paid", "processing", "completed"].includes(order.status),
    )
    .reduce((total, order) => total + order.totalSen, 0);

  return (
    <PageSkeleton name="orders" loading={false}>
      <main>
        <PageHeader
          title="Orders"
          kicker="Commerce"
          icon={Icons.Domain.Orders}
          description="Verify payments and move orders through fulfillment."
        />

        <StatStrip className="mb-6">
          <StatItem
            label="Needs Action"
            value={needsAction.length}
            hint="Pending or waiting payment"
            icon={Icons.Domain.Lightning}
          />
          <StatItem
            label="In Progress"
            value={inProgress.length}
            hint="Paid or processing"
            icon={Icons.Domain.Orders}
          />
          <StatItem
            label="Done"
            value={done.length}
            hint="Completed or cancelled"
            icon={Icons.Status.Success}
          />
          <StatItem
            label="Revenue"
            value={formatRM(paidRevenue)}
            hint="Paid and completed orders"
            icon={Icons.Domain.Revenue}
          />
        </StatStrip>

        <div className="mb-6 border bg-card p-4 shadow-xs">
          <SegmentedBar
            title="Fulfillment pipeline"
            segments={[
              {
                label: "Needs action",
                value: needsAction.length,
                color: "var(--color-amber-500)",
              },
              {
                label: "In progress",
                value: inProgress.length,
                color: "var(--color-blue-500)",
              },
              {
                label: "Done",
                value: done.length,
                color: "var(--color-emerald-500)",
              },
            ]}
          />
        </div>

        <Tabs defaultValue="action">
          <TabsList className="mobile:w-full">
            <TabsTrigger value="action" className="mobile:flex-1">
              Needs action ({needsAction.length})
            </TabsTrigger>
            <TabsTrigger value="progress" className="mobile:flex-1">
              In progress ({inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="done" className="mobile:flex-1">
              Done ({done.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="action" className="mt-4">
            <OrdersTable
              rows={needsAction}
              emptyMessage="No orders waiting on you."
              statusOptions={statusFilterOptions([
                "pending",
                "waiting_payment",
              ])}
            />
          </TabsContent>
          <TabsContent value="progress" className="mt-4">
            <OrdersTable
              rows={inProgress}
              emptyMessage="Nothing in fulfillment right now."
              statusOptions={statusFilterOptions(["paid", "processing"])}
            />
          </TabsContent>
          <TabsContent value="done" className="mt-4">
            <OrdersTable
              rows={done}
              emptyMessage="No completed or cancelled orders yet."
              statusOptions={statusFilterOptions(["completed", "cancelled"])}
            />
          </TabsContent>
        </Tabs>
      </main>
    </PageSkeleton>
  );
}
