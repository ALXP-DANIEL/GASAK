import { DataTable } from "@components/shared/data-table";
import { PRODUCT_CATEGORY_LABELS } from "@lib/labels";
import { db, productCategoryEnum, products } from "@server/db";
import { requireOrgRole } from "@server/session";
import { desc } from "drizzle-orm";
import { PageHeader } from "../_components/page-surface";
import { columns } from "./_components/columns";
import { ProductFormDialog } from "./_components/product-form";

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

  return (
    <main>
      <PageHeader
        title="Products"
        description="Diamonds, weekly passes, joki, and coaching packages."
      >
        <ProductFormDialog />
      </PageHeader>
      <DataTable
        columns={columns}
        data={rows}
        emptyMessage="No products yet. Add your first product."
        searchColumnId="name"
        searchPlaceholder="Search products..."
        facetedFilters={[
          {
            columnId: "category",
            title: "Category",
            options: categoryFilterOptions,
          },
        ]}
      />
    </main>
  );
}
