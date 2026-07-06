import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ContentCardGrid } from "@/components/cards";
import { ProductCard } from "@/components/products/product-card";
import { DeleteButton } from "@/components/shared/delete-button";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { formatRM } from "@/lib/format";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/labels";
import { deleteProduct } from "@/server/actions/shop";
import { db, products } from "@/server/db";
import { requireDashboardRole } from "../../_components/dashboard-section";
import { DetailRow, PageHeader } from "../../_components/page-surface";
import { ProductFormDialog } from "../_components/product-form";

export const dynamic = "force-dynamic";

async function getProduct(productId: string) {
  return db.query.products.findFirst({
    where: eq(products.id, productId),
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  await requireDashboardRole("admin", "seller");
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) notFound();

  return (
    <main>
      <PageHeader
        title={product.name}
        description="Preview and manage this shop product."
      />

      <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_24rem]">
        <ContentCardGrid>
          <ProductCard product={product} variant="default" action={false} />
        </ContentCardGrid>

        <div className="grid h-fit gap-4">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle>Manage product</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <ProductFormDialog product={product} />
              <DeleteButton
                action={deleteProduct.bind(null, product.id)}
                title="Delete product?"
                description={`This will permanently remove "${product.name}".`}
                redirectTo="/dashboard/products"
              />
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle>Product details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <DetailRow
                label="Category"
                value={PRODUCT_CATEGORY_LABELS[product.category]}
              />
              <DetailRow label="Price" value={formatRM(product.priceSen)} />
              <DetailRow label="Stock" value={product.stock} />
              <DetailRow
                label="Status"
                value={
                  <Badge variant={product.active ? "default" : "outline"}>
                    {product.active ? "Visible" : "Hidden"}
                  </Badge>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
