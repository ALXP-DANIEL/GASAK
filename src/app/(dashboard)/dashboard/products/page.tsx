import { ContentCardGrid, ProductCard } from "@components/cards";
import { Badge } from "@components/ui/shadcn/badge";
import { PRODUCT_CATEGORY_LABELS } from "@lib/labels";
import { db, products } from "@server/db";
import { requireOrgRole } from "@server/session";
import { desc } from "drizzle-orm";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { ProductFormDialog } from "./_components/product-form";

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

      {rows.length === 0 ? (
        <EmptyState message="No products yet. Add your first product." />
      ) : (
        <ContentCardGrid>
          {rows.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="default"
              href={`/dashboard/products/${product.id}`}
              meta={
                <>
                  <Badge variant="secondary">
                    {PRODUCT_CATEGORY_LABELS[product.category]}
                  </Badge>
                  <Badge variant="outline">{product.stock} stock</Badge>
                  <Badge variant={product.active ? "default" : "outline"}>
                    {product.active ? "Active" : "Hidden"}
                  </Badge>
                </>
              }
              footer={
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {product.stock} in stock
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {product.active ? "Visible in shop" : "Hidden from shop"}
                  </span>
                </div>
              }
              action={<ProductFormDialog product={product} />}
            />
          ))}
        </ContentCardGrid>
      )}
    </main>
  );
}
