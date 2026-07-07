import { DataTable } from "@components/shared/data-table";
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
import { columns } from "./_components/columns";

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
        <TabsList>
          <TabsTrigger value="action">
            Needs action ({needsAction.length})
          </TabsTrigger>
          <TabsTrigger value="progress">
            In progress ({inProgress.length})
          </TabsTrigger>
          <TabsTrigger value="done">Done ({done.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="action" className="mt-4">
          <DataTable
            columns={columns}
            data={needsAction}
            emptyMessage="No orders waiting on you."
            searchColumnId="orderNo"
            searchPlaceholder="Search order no, customer..."
            facetedFilters={[
              {
                columnId: "status",
                title: "Status",
                options: statusFilterOptions(["pending", "waiting_payment"]),
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="progress" className="mt-4">
          <DataTable
            columns={columns}
            data={inProgress}
            emptyMessage="Nothing in fulfillment right now."
            searchColumnId="orderNo"
            searchPlaceholder="Search order no, customer..."
            facetedFilters={[
              {
                columnId: "status",
                title: "Status",
                options: statusFilterOptions(["paid", "processing"]),
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          <DataTable
            columns={columns}
            data={done}
            emptyMessage="No completed or cancelled orders yet."
            searchColumnId="orderNo"
            searchPlaceholder="Search order no, customer..."
            facetedFilters={[
              {
                columnId: "status",
                title: "Status",
                options: statusFilterOptions(["completed", "cancelled"]),
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
