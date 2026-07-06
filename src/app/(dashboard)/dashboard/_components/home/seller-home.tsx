import {
  type RevenuePoint,
  RevenueTrendChart,
} from "@components/charts/revenue-trend-chart";
import { Icons } from "@components/icons";
import { Badge } from "@components/ui/shadcn/badge";
import { formatDateTime, formatRM } from "@lib/format";
import { ORDER_STATUS_LABELS } from "@lib/labels";
import { db, orders, products } from "@server/db";
import { format, startOfMonth, subDays } from "date-fns";
import { and, count, desc, eq, gte, inArray, sum } from "drizzle-orm";
import {
  EmptyState,
  HomeListItem,
  HomePanel,
  StatCard,
  StatGrid,
} from "./widgets";

export async function SellerHome() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const trendStart = subDays(now, 29);

  const [
    [paidAgg],
    [productCount],
    [outOfStock],
    [pendingCount],
    [ordersThisMonth],
    recentOrders,
    paidOrders,
  ] = await Promise.all([
    db
      .select({ revenue: sum(orders.totalSen), orderCount: count() })
      .from(orders)
      .where(inArray(orders.status, ["paid", "processing", "completed"])),
    db
      .select({ value: count() })
      .from(products)
      .where(eq(products.active, true)),
    db
      .select({ value: count() })
      .from(products)
      .where(and(eq(products.active, true), eq(products.stock, 0))),
    db
      .select({ value: count() })
      .from(orders)
      .where(inArray(orders.status, ["pending", "waiting_payment"])),
    db
      .select({ value: count() })
      .from(orders)
      .where(gte(orders.createdAt, monthStart)),
    db.query.orders.findMany({
      orderBy: desc(orders.createdAt),
      limit: 6,
      with: { product: true },
    }),
    db
      .select({ totalSen: orders.totalSen, updatedAt: orders.updatedAt })
      .from(orders)
      .where(
        and(
          inArray(orders.status, ["paid", "processing", "completed"]),
          gte(orders.updatedAt, trendStart),
        ),
      ),
  ]);

  const revenueTrend: RevenuePoint[] = Array.from({ length: 30 }, (_, i) => {
    const day = subDays(now, 29 - i);
    return { key: format(day, "yyyy-MM-dd"), label: format(day, "d MMM") };
  }).map(({ key, label }) => ({
    label,
    revenue:
      paidOrders
        .filter((order) => format(order.updatedAt, "yyyy-MM-dd") === key)
        .reduce((total, order) => total + order.totalSen, 0) / 100,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Seller Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Store overview for orders, products, revenue, and fulfillment.
        </p>
      </div>

      <StatGrid>
        <StatCard
          label="Revenue"
          value={formatRM(Number(paidAgg.revenue ?? 0))}
          icon={Icons.Domain.Revenue}
          hint={`${paidAgg.orderCount} paid orders`}
        />
        <StatCard
          label="Orders This Month"
          value={ordersThisMonth.value}
          icon={Icons.Domain.Orders}
          hint={`${pendingCount.value} awaiting payment`}
        />
        <StatCard
          label="Active Products"
          value={productCount.value}
          icon={Icons.Domain.Products}
          hint={`${outOfStock.value} out of stock`}
        />
        <StatCard
          label="Pending Orders"
          value={pendingCount.value}
          icon={Icons.Status.Pending}
          hint="Needs fulfillment"
        />
      </StatGrid>

      <HomePanel
        title="Revenue — Last 30 Days"
        description="Daily revenue from paid orders"
      >
        <RevenueTrendChart data={revenueTrend} />
      </HomePanel>

      <HomePanel title="Recent Orders" description="Latest store activity">
        {recentOrders.length === 0 && <EmptyState message="No orders yet." />}
        {recentOrders.map((order) => (
          <HomeListItem
            key={order.id}
            title={`${order.product?.name ?? "Unknown product"} × ${order.quantity}`}
            meta={`${order.customerName} · ${formatDateTime(order.createdAt)}`}
            trailing={
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums">
                  {formatRM(order.totalSen)}
                </span>
                <Badge variant="outline">
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>
            }
          />
        ))}
      </HomePanel>
    </div>
  );
}
