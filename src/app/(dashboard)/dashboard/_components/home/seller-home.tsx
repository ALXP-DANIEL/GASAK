import { type RevenuePoint, RevenueTrendChart } from "@components/charts/lazy";
import { Icons } from "@components/icons";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { Badge } from "@components/ui/shadcn/badge";
import { formatDateTime, formatMY, formatRM } from "@lib/format";
import { ORDER_STATUS_LABELS } from "@lib/labels";
import { db, orders, products } from "@server/db";
import { startOfMonth, subDays } from "date-fns";
import { and, count, desc, eq, gte, inArray, sum } from "drizzle-orm";
import { PageHeader } from "../page-surface";
import { EmptyState, HomeListItem, HomePanel } from "./widgets";

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
    fulfillmentQueue,
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
      where: inArray(orders.status, ["pending", "waiting_payment", "paid"]),
      orderBy: desc(orders.createdAt),
      limit: 6,
      with: { product: true },
    }),
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
    return { key: formatMY(day, "yyyy-MM-dd"), label: formatMY(day, "d MMM") };
  }).map(({ key, label }) => ({
    label,
    revenue:
      paidOrders
        .filter((order) => formatMY(order.updatedAt, "yyyy-MM-dd") === key)
        .reduce((total, order) => total + order.totalSen, 0) / 100,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Seller Dashboard"
        kicker={`Overview — ${formatMY(now, "EEEE, d MMMM")}`}
        icon={Icons.Domain.Shop}
        description="Store overview for orders, products, revenue, and fulfillment."
      />

      <StatStrip>
        <StatItem
          label="Revenue"
          value={formatRM(Number(paidAgg.revenue ?? 0))}
          hint={`${paidAgg.orderCount} paid orders`}
          icon={Icons.Domain.Revenue}
        />
        <StatItem
          label="Orders This Month"
          value={ordersThisMonth.value}
          hint={`${pendingCount.value} awaiting payment`}
          icon={Icons.Domain.Orders}
        />
        <StatItem
          label="Active Products"
          value={productCount.value}
          hint={`${outOfStock.value} out of stock`}
          icon={Icons.Domain.Products}
        />
        <StatItem
          label="Needs Fulfillment"
          value={pendingCount.value}
          hint="Pending or waiting payment"
          icon={Icons.Domain.Lightning}
        />
      </StatStrip>

      <div className="grid grid-cols-1 gap-4 desktop:grid-cols-3">
        <HomePanel
          title="Revenue — Last 30 Days"
          description="Daily revenue from paid orders"
          className="desktop:col-span-2"
        >
          <RevenueTrendChart data={revenueTrend} />
        </HomePanel>

        <HomePanel
          title="Fulfillment Queue"
          description="Orders that need a next step"
          action={{ href: "/dashboard/orders", label: "View all" }}
        >
          {fulfillmentQueue.length === 0 && (
            <EmptyState message="Queue is clear." />
          )}
          {fulfillmentQueue.map((order) => (
            <HomeListItem
              key={order.id}
              href="/dashboard/orders"
              title={`${order.product?.name ?? "Unknown product"} × ${order.quantity}`}
              meta={order.customerName}
              trailing={
                <Badge variant="outline">
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              }
            />
          ))}
        </HomePanel>
      </div>

      <HomePanel
        title="Recent Orders"
        description="Latest store activity"
        action={{ href: "/dashboard/orders", label: "View all" }}
      >
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
