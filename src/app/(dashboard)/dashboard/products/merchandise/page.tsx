import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { buttonVariants } from "@components/ui/shadcn/button";
import { db, products } from "@server/db";
import { requireOrgRole } from "@server/session";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PageHeader } from "../../_components/page-surface";
import { MerchTable } from "./_components/merch-table";

export default async function MerchandisePage() {
  await requireOrgRole("admin", "seller");

  const rows = await db
    .select()
    .from(products)
    .where(eq(products.category, "merchandise"))
    .orderBy(desc(products.createdAt));

  const active = rows.filter((p) => p.active);
  const outOfStock = active.filter((p) => !p.hasVariants && p.stock === 0);
  const withVariants = rows.filter((p) => p.hasVariants);

  return (
    <PageSkeleton name="merchandise" loading={false}>
      <main>
        <PageHeader
          title="Merchandise"
          kicker="Commerce"
          icon={Icons.Domain.Merchandise}
          description="Physical items — jerseys, hoodies, and other GASAK gear."
        >
          <Link
            href="/dashboard/products/new?category=merchandise"
            className={buttonVariants({ variant: "default" })}
          >
            New merch item
          </Link>
        </PageHeader>

        <div className="flex flex-col gap-6">
          <StatStrip>
            <StatItem
              label="Active"
              value={active.length}
              hint={`${rows.length} items total`}
              icon={Icons.Domain.Merchandise}
            />
            <StatItem
              label="Out of Stock"
              value={outOfStock.length}
              hint="Active, no-variant items at zero stock"
              icon={Icons.Domain.Lightning}
            />
            <StatItem
              label="With Variants"
              value={withVariants.length}
              hint="Have size/color options configured"
              icon={Icons.Domain.Products}
            />
          </StatStrip>

          <MerchTable rows={rows} />
        </div>
      </main>
    </PageSkeleton>
  );
}
