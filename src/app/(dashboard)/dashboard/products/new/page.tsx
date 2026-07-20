import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import type { ProductCategory } from "@server/db";
import { productCategoryEnum } from "@server/db";
import { requireDashboardRole } from "../../_components/dashboard-section";
import { PageHeader } from "../../_components/page-surface";
import { ProductFormPage } from "../_components/product-form-page";

function isProductCategory(value: string): value is ProductCategory {
  return (productCategoryEnum.enumValues as string[]).includes(value);
}

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireDashboardRole("admin", "seller");
  const { category } = await searchParams;
  // Only merchandise is creatable for now — other categories will be rebuilt
  // from scratch later, so an absent/unknown category falls back to merch.
  const fixedCategory: ProductCategory =
    category && isProductCategory(category) ? category : "merchandise";

  return (
    <PageSkeleton name="products-new" loading={false}>
      <main>
        <PageHeader
          title="New product"
          breadcrumbLabel="New"
          kicker="Products"
          icon={Icons.Domain.Products}
          description="Set up pricing, media, and variants for this product."
        />
        <ProductFormPage fixedCategory={fixedCategory} />
      </main>
    </PageSkeleton>
  );
}
