import { BuyButton, ContentCardGrid, ProductCard } from "@components/cards";
import { PageHero, SectionHeader } from "@components/ui/brand";
import { PRODUCT_CATEGORY_LABELS } from "@lib/labels";
import { createPageMetadata } from "@lib/metadata";
import {
  db,
  type ProductCategory,
  productCategoryEnum,
  products,
} from "@server/db";
import { and, eq, gt } from "drizzle-orm";
import { OrderLookup } from "./order-lookup";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "shop",
  description:
    "MLBB diamonds, weekly passes, joki, and coaching from GASAK Esports.",
  path: "/shop",
  type: "Shop",
});

export default async function shopPage() {
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
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
          <ContentCardGrid>
            {group.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="default"
                href={`/shop/${product.id}`}
                action={<BuyButton product={product} />}
              />
            ))}
          </ContentCardGrid>
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
