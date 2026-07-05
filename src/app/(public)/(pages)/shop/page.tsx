import { and, eq, gt } from "drizzle-orm";
import { ProductCard } from "@/components/public/content-cards";
import { PageHero, SectionHeader } from "@/components/ui/brand";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/labels";
import { createPageMetadata } from "@/lib/metadata";
import {
  db,
  type ProductCategory,
  productCategoryEnum,
  products,
} from "@/server/db";
import { BuyButton } from "./buy-button";
import { OrderLookup } from "./order-lookup";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Shop",
  description:
    "MLBB diamonds, weekly passes, joki, and coaching from GASAK Esports.",
  path: "/shop",
});

export default async function ShopPage() {
  const items = await db
    .select()
    .from(products)
    .where(and(eq(products.active, true), gt(products.stock, 0)))
    .orderBy(products.category, products.priceSen);

  const byCategory = productCategoryEnum.enumValues
    .map((category) => ({
      category: category as ProductCategory,
      items: items.filter((p) => p.category === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-center gap-5 text-center">
        <PageHero
          eyebrow="GASAK Shop"
          title="Gear up for the next push"
          description="Diamonds, weekly passes, joki, and coaching with guest checkout by DuitNow QR, FPX, or card."
        />
        <OrderLookup />
      </div>

      {byCategory.map(({ category, items: group }) => (
        <section key={category} className="flex flex-col gap-4">
          <SectionHeader
            align="left"
            title={PRODUCT_CATEGORY_LABELS[category]}
          />
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                mode="full"
                action={<BuyButton product={product} />}
              />
            ))}
          </div>
        </section>
      ))}

      {byCategory.length === 0 && (
        <p className="text-muted-foreground">
          The shop is being restocked — check back soon.
        </p>
      )}
    </div>
  );
}
