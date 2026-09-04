import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { buttonVariants } from "@components/ui/shadcn/button";
import { db, orders, type ProductCategory } from "@server/db";
import { requireOrgRole } from "@server/session";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { PageHeader } from "../../_components/page-surface";
import { OrdersTable } from "../../orders/_components/orders-table";

type CategoryOrderEnquiriesPageProps = {
  category: Extract<ProductCategory, "joki" | "merchandise">;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
};

/**
 * Joki and merchandise buyers already create an order at checkout. This is
 * their category-specific enquiry queue, deliberately backed by those orders
 * so customer contact details and payment status stay in one source of truth.
 */
export async function CategoryOrderEnquiriesPage({
  category,
  title,
  description,
  backHref,
  backLabel,
}: CategoryOrderEnquiriesPageProps) {
  await requireOrgRole("admin", "seller");

  const allOrders = await db.query.orders.findMany({
    orderBy: desc(orders.createdAt),
    with: { product: true },
  });
  const rows = allOrders.filter((order) => order.product.category === category);
  const newRequests = rows.filter((order) => order.status === "pending");
  const awaitingPayment = rows.filter(
    (order) => order.status === "waiting_payment",
  );
  const inProgress = rows.filter((order) =>
    ["paid", "processing"].includes(order.status),
  );

  return (
    <PageSkeleton name={`${category}-enquiries`} loading={false}>
      <main>
        <PageHeader
          title={title}
          kicker="Commerce"
          icon={Icons.Domain.Orders}
          description={description}
        >
          <Link
            href={backHref}
            className={buttonVariants({ variant: "outline" })}
          >
            {backLabel}
          </Link>
        </PageHeader>

        <div className="flex flex-col gap-6">
          <StatStrip>
            <StatItem
              label="New"
              value={newRequests.length}
              hint="Awaiting first contact"
              icon={Icons.Status.Pending}
            />
            <StatItem
              label="Awaiting Payment"
              value={awaitingPayment.length}
              hint="Buyer has been contacted"
              icon={Icons.Domain.Lightning}
            />
            <StatItem
              label="In Progress"
              value={inProgress.length}
              hint="Paid or being fulfilled"
              icon={Icons.Domain.Orders}
            />
            <StatItem
              label="Total"
              value={rows.length}
              hint="All buyer requests"
              icon={Icons.Domain.Products}
            />
          </StatStrip>

          <OrdersTable
            rows={rows}
            emptyMessage="No buyer enquiries yet."
            statusOptions={[
              { value: "pending", label: "Pending" },
              { value: "waiting_payment", label: "Waiting Payment" },
              { value: "paid", label: "Paid" },
              { value: "processing", label: "Processing" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </div>
      </main>
    </PageSkeleton>
  );
}
