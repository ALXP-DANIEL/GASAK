import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/shadcn/tabs";
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

export const dynamic = "force-dynamic";

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

  return (
    <main>
      <PageHeader
        title="Orders"
        description="Verify payments and move orders through fulfillment."
      />

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
            statusOptions={statusFilterOptions(["pending", "waiting_payment"])}
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
  );
}
