import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { db, products } from "@server/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireDashboardRole } from "../../../_components/dashboard-section";
import { PageHeader } from "../../../_components/page-surface";
import { ProductFormPage } from "../../_components/product-form-page";

async function getProduct(productId: string) {
  return db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      options: { with: { values: true } },
      variants: { with: { optionValues: { with: { optionValue: true } } } },
    },
  });
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  await requireDashboardRole("admin", "seller");
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) notFound();

  return (
    <PageSkeleton name="products-edit" loading={false}>
      <main>
        <PageHeader
          title={`Edit ${product.name}`}
          breadcrumbLabel="Edit"
          kicker="Products"
          icon={Icons.Domain.Products}
          description="Update pricing, media, and variants for this product."
        />
        {/* Category changes are disabled while the catalog only carries joki
            and merchandise — the product keeps whatever category it has. */}
        <ProductFormPage product={product} fixedCategory={product.category} />
      </main>
    </PageSkeleton>
  );
}
