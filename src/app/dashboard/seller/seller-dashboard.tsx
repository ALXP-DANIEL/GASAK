import { startOfMonth, subDays } from "date-fns";
import { and, count, desc, eq, gte, inArray, sum } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import {
  ProductSalesDonutChart,
  type ProductSalesPoint,
  type RevenuePoint,
  SellerRevenueChart,
} from "@/components/dashboard/revenue-chart";
import {
  DashboardPanel,
  EmptyState,
  StatCard,
} from "@/components/dashboard/widgets";
import { Icons } from "@/components/icons";
import { BrandBadge } from "@/components/ui/brand";
import { Button } from "@/components/ui/shadcn/button";
import { formatDate, formatDateTime, formatRM } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/labels";
import { db, orders, products } from "@/server/db";

export async function SellerDashboard() {
  const now = new Date();
  const since = subDays(now, 30);
  const monthStart = startOfMonth(now);
  const [
    paidAgg,
    [productCount],
    [outOfStockProducts],
    [pendingCount],
    [completedCount],
    [totalOrders],
    [ordersThisMonth],
    recentOrders,
    paidOrders,
    sellerOrders,
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
      .where(eq(orders.status, "completed")),
    db.select({ value: count() }).from(orders),
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
          gte(orders.updatedAt, since),
        ),
      ),
    db.query.orders.findMany({
      orderBy: desc(orders.createdAt),
      limit: 60,
      with: { product: true },
    }),
  ]);

  const paidRevenue = Number(paidAgg[0]?.revenue ?? 0);
  const averageOrderSen =
    totalOrders.value > 0
      ? Math.round(
          sellerOrders.reduce(
            (sumValue, order) => sumValue + order.totalSen,
            0,
          ) / sellerOrders.length,
        )
      : 0;

  const days: RevenuePoint[] = Array.from({ length: 31 }, (_, i) => {
    const date = subDays(now, 30 - i);
    const key = formatDate(date);
    const revenueSen = paidOrders
      .filter((o) => formatDate(o.updatedAt) === key)
      .reduce((acc, o) => acc + o.totalSen, 0);
    return { day: key.slice(0, key.lastIndexOf(" ")), revenueSen };
  });

  const productSales = sellerOrders.reduce<Record<string, ProductSalesPoint>>(
    (acc, order) => {
      const current = acc[order.product.name] ?? {
        name: order.product.name,
        quantity: 0,
        revenueSen: 0,
      };
      current.quantity += order.quantity;
      current.revenueSen += order.totalSen;
      acc[order.product.name] = current;
      return acc;
    },
    {},
  );
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-lg border border-primary/25 bg-card">
        <div
          className="absolute inset-0 bg-[url('/images/hero.png')] bg-cover bg-center opacity-45"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/85 to-background/20" />
        <div className="relative flex min-h-36 items-center p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              GASAK Store
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-wide">
              Welcome back, Seller
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening with your store today.
            </p>
          </div>
        </div>
      </section>

      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Total revenue"
          value={formatRM(paidRevenue)}
          Icon={Icons.Domain.Revenue}
          hint="Verified payments"
        />
        <StatCard
          label="Total orders"
          value={totalOrders.value}
          Icon={Icons.Domain.Orders}
          hint={`+${ordersThisMonth.value} this month`}
        />
        <StatCard
          label="Pending orders"
          value={pendingCount.value}
          Icon={Icons.Domain.Calendar}
          hint="Needs action"
        />
        <StatCard
          label="Completed orders"
          value={completedCount.value}
          Icon={Icons.Status.Success}
          hint="Fulfilled"
        />
        <StatCard
          label="Total products"
          value={productCount.value}
          Icon={Icons.Domain.Products}
          hint={`${outOfStockProducts.value} out of stock`}
        />
        <StatCard
          label="Average order"
          value={formatRM(averageOrderSen)}
          Icon={Icons.Stats.Goal}
          hint="Per order"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr_1.05fr]">
        <DashboardPanel
          title="Revenue overview"
          description="Last 31 days"
          action={<BrandBadge>This month</BrandBadge>}
        >
          <SellerRevenueChart data={days} />
        </DashboardPanel>

        <DashboardPanel
          title="Top selling products"
          description="By units sold"
        >
          {topProducts.length > 0 ? (
            <ProductSalesDonutChart
              data={topProducts}
              totalOrders={totalOrders.value}
            />
          ) : (
            <EmptyState message="No product sales yet." />
          )}
        </DashboardPanel>

        <SellerRecentOrdersPanel orders={recentOrders} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <OrdersOverviewPanel orders={sellerOrders.slice(0, 6)} />
        <SalesSummaryPanel
          revenueSen={paidRevenue}
          totalOrders={totalOrders.value}
          averageOrderSen={averageOrderSen}
          pendingOrders={pendingCount.value}
          completedOrders={completedCount.value}
        />
      </div>
    </div>
  );
}

function SellerRecentOrdersPanel({
  orders: items,
}: {
  orders: (typeof orders.$inferSelect & {
    product: typeof products.$inferSelect;
  })[];
}) {
  return (
    <DashboardPanel
      title="Recent orders"
      description={
        <Link href="/dashboard/orders" className="hover:text-foreground">
          View all →
        </Link>
      }
    >
      <div className="grid gap-2">
        {items.map((order) => (
          <div
            key={order.id}
            className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-primary/10 py-2 text-sm last:border-0"
          >
            <div className="relative flex size-10 items-center justify-center overflow-hidden rounded border border-primary/20 bg-primary/10">
              {order.product.imageUrl ? (
                <Image
                  src={order.product.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Icons.Domain.Products size={20} className="text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-primary">
                {order.orderNo}
              </p>
              <p className="truncate font-medium">{order.product.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatRM(order.totalSen)}</p>
              <BrandBadge>{ORDER_STATUS_LABELS[order.status]}</BrandBadge>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState message="No orders yet." />}
      </div>
    </DashboardPanel>
  );
}

function OrdersOverviewPanel({
  orders: items,
}: {
  orders: (typeof orders.$inferSelect & {
    product: typeof products.$inferSelect;
  })[];
}) {
  const tabs = [
    "All",
    "Pending",
    "Paid",
    "Processing",
    "Completed",
    "Cancelled",
  ];

  return (
    <DashboardPanel
      title="Orders overview"
      action={<BrandBadge>Filter</BrandBadge>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab, index) => (
          <span
            key={tab}
            className={`rounded-full px-3 py-1 text-xs ${
              index === 0
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-primary/15 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-3 font-medium">Order ID</th>
              <th className="py-3 font-medium">Product</th>
              <th className="py-3 font-medium">Customer</th>
              <th className="py-3 font-medium">Total</th>
              <th className="py-3 font-medium">Status</th>
              <th className="py-3 font-medium">Date</th>
              <th className="py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((order) => (
              <tr key={order.id} className="border-b border-primary/10">
                <td className="py-3 font-medium text-primary">
                  {order.orderNo}
                </td>
                <td className="py-3">{order.product.name}</td>
                <td className="py-3 text-muted-foreground">
                  {order.customerPhone}
                </td>
                <td className="py-3">{formatRM(order.totalSen)}</td>
                <td className="py-3">
                  <BrandBadge>{ORDER_STATUS_LABELS[order.status]}</BrandBadge>
                </td>
                <td className="py-3 text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </td>
                <td className="py-3 text-right">
                  <Link
                    href="/dashboard/orders"
                    className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <EmptyState message="No orders yet." />}
      </div>
    </DashboardPanel>
  );
}

function SalesSummaryPanel({
  revenueSen,
  totalOrders,
  averageOrderSen,
  pendingOrders,
  completedOrders,
}: {
  revenueSen: number;
  totalOrders: number;
  averageOrderSen: number;
  pendingOrders: number;
  completedOrders: number;
}) {
  const rows = [
    ["Total revenue", formatRM(revenueSen), "+ this month"],
    ["Total orders", totalOrders.toString(), "live"],
    ["Average order value", formatRM(averageOrderSen), "per order"],
    ["Pending orders", pendingOrders.toString(), "needs action"],
    ["Completed orders", completedOrders.toString(), "fulfilled"],
  ];

  return (
    <DashboardPanel
      title="Sales summary"
      action={<BrandBadge>This month</BrandBadge>}
    >
      <div className="grid gap-1">
        {rows.map(([label, value, hint]) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-primary/10 py-3 last:border-0"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="text-right">
              <p className="font-medium">{value}</p>
              <p className="text-xs text-primary">{hint}</p>
            </div>
          </div>
        ))}
      </div>
      <Button asChild variant="outline" className="mt-5 w-full">
        <Link href="/dashboard/orders">View full report</Link>
      </Button>
    </DashboardPanel>
  );
}
