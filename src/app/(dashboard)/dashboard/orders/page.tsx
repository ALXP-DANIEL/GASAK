import { desc } from "drizzle-orm";
import { Input } from "@/components/ui/shadcn/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn/tabs";
import { requireOrgRole } from "@/lib/session";
import { db, orders } from "@/server/db";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { OrderCard } from "./_components/order-card";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  await requireOrgRole("admin", "seller");
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().toLowerCase() : "";

  const allRows = await db.query.orders.findMany({
    orderBy: desc(orders.createdAt),
    with: { product: true },
  });

  const rows = query
    ? allRows.filter((order) =>
        [
          order.orderNo,
          order.customerName,
          order.customerEmail,
          order.customerPhone,
          order.product.name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : allRows;

  const needsAction = rows.filter(
    (order) => order.status === "pending" || order.status === "waiting_payment",
  );
  const inProgress = rows.filter(
    (order) => order.status === "paid" || order.status === "processing",
  );
  const done = rows.filter(
    (order) => order.status === "completed" || order.status === "cancelled",
  );

  const renderList = (list: typeof rows, empty: string) =>
    list.length === 0 ? (
      <EmptyState message={empty} />
    ) : (
      <div className="grid gap-4 xl:grid-cols-2">
        {list.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    );

  return (
    <main>
      <PageHeader
        title="Orders"
        description="Verify payments and move orders through fulfillment."
      >
        <form method="GET" className="w-full desktop:w-72">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search order no, customer..."
          />
        </form>
      </PageHeader>

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
          {renderList(needsAction, "No orders waiting on you.")}
        </TabsContent>
        <TabsContent value="progress" className="mt-4">
          {renderList(inProgress, "Nothing in fulfillment right now.")}
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          {renderList(done, "No completed or cancelled orders yet.")}
        </TabsContent>
      </Tabs>
    </main>
  );
}
