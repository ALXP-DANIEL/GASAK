import { SegmentedBar } from "@components/charts/segmented-bar";
import { Icons } from "@components/icons";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { PRODUCT_CATEGORY_LABELS } from "@lib/labels";
import { db, productCategoryEnum, products } from "@server/db";
import { requireOrgRole } from "@server/session";
import { desc } from "drizzle-orm";
import { PageHeader } from "../_components/page-surface";
import { ProductFormDialog } from "./_components/product-form";
import { ProductsTable } from "./_components/products-table";

const categoryFilterOptions = productCategoryEnum.enumValues.map((value) => ({
  value,
  label: PRODUCT_CATEGORY_LABELS[value],
}));

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await requireOrgRole("admin", "seller");

  const rows = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  const active = rows.filter((product) => product.active);
  const outOfStock = active.filter((product) => product.stock === 0);
  const categoryMix = productCategoryEnum.enumValues.map((category, index) => ({
    label: PRODUCT_CATEGORY_LABELS[category],
    value: rows.filter((product) => product.category === category).length,
    color: `var(--chart-${(index % 5) + 1})`,
  }));
  const categories = categoryMix.filter((entry) => entry.value > 0).length;

  return (
    <main>
      <PageHeader
        title="Products"
        kicker="Commerce"
        icon={Icons.Domain.Products}
        description="Diamonds, weekly passes, joki, and coaching packages."
      >
        <ProductFormDialog />
      </PageHeader>

      <div className="flex flex-col gap-6">
        <StatStrip>
          <StatItem
            label="Active"
            value={active.length}
            hint={`${rows.length} products total`}
            icon={Icons.Domain.Products}
          />
          <StatItem
            label="Out of Stock"
            value={outOfStock.length}
            hint="Active products at zero stock"
            icon={Icons.Domain.Lightning}
          />
          <StatItem
            label="Categories"
            value={categories}
            hint="In the catalog"
            icon={Icons.Domain.Shop}
          />
        </StatStrip>

        <div className="border bg-card p-4 shadow-xs">
          <SegmentedBar title="Catalog by category" segments={categoryMix} />
        </div>

        <ProductsTable
          rows={rows}
          categoryFilterOptions={categoryFilterOptions}
        />
      </div>
    </main>
  );
}
