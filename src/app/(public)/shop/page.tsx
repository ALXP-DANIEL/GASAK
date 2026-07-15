"use cache";

import { BuyButton, ContentCardGrid, ProductCard } from "@components/cards";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { LinkButton, PageHero, SectionHeader } from "@components/ui/brand";
import { sortJokiTiers } from "@lib/joki";
import { PRODUCT_CATEGORY_LABELS } from "@lib/labels";
import { createPageMetadata } from "@lib/metadata";
import {
  db,
  jokiPackages,
  jokiServiceImages,
  jokiTiers,
  type ProductCategory,
  productCategoryEnum,
  products,
} from "@server/db";
import { and, eq, gt, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { OrderLookup } from "./order-lookup";

export const metadata = createPageMetadata({
  title: "shop",
  description:
    "MLBB diamonds, weekly passes, joki, and coaching from GASAK Esports.",
  path: "/shop",
  type: "Shop",
});

export default async function shopPage() {
  cacheLife("hours");
  cacheTag("products");
  cacheTag("joki");

  const [items, tierRows, packageRows, serviceImages] = await Promise.all([
    db
      .select()
      .from(products)
      .where(and(eq(products.active, true), gt(products.stock, 0)))
      .orderBy(products.category, products.priceSen),
    db.select().from(jokiTiers).where(eq(jokiTiers.active, true)),
    db.select().from(jokiPackages).where(eq(jokiPackages.active, true)),
    db
      .select()
      .from(jokiServiceImages)
      .where(inArray(jokiServiceImages.mode, ["per_star", "package"])),
  ]);
  const jokiTiersSorted = sortJokiTiers(tierRows);
  const cheapestPerStar = jokiTiersSorted[0]?.pricePerStarSen ?? 0;
  const cheapestPackage = packageRows.reduce(
    (min, p) => (!min || p.priceSen < min ? p.priceSen : min),
    0,
  );
  const imageByMode = new Map(serviceImages.map((r) => [r.mode, r.imageUrl]));

  const byCategory = productCategoryEnum.enumValues
    .map((category) => ({
      category: category as ProductCategory,
      items: items.filter((p) => p.category === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <PageSkeleton name="shop-public" loading={false}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
        <div className="flex flex-col items-center gap-5 text-center">
          <PageHero
            eyebrow="GASAK Shop"
            title="Gear up for the next push"
            description="Diamonds, weekly passes, joki, and coaching with guest checkout by DuitNow QR, FPX, or card."
          />
          <OrderLookup />
        </div>

        <section className="flex flex-col gap-4">
          <SectionHeader align="left" title="Joki Rank MLBB" />
          <ContentCardGrid>
            <ProductCard
              product={{
                name: "Joki — Per Star",
                priceSen: cheapestPerStar,
                description:
                  "Pick your current and target rank — stars and price are calculated automatically across every rate tier crossed.",
                imageUrl: imageByMode.get("per_star"),
              }}
              variant="default"
              href="/shop/joki/per-star"
              footer={
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Priced per star
                </p>
              }
              action={
                <LinkButton
                  href="/shop/joki/per-star"
                  size="sm"
                  className="w-full"
                >
                  View
                </LinkButton>
              }
            />
            <ProductCard
              product={{
                name: "Joki — Package Promo",
                priceSen: cheapestPackage,
                description:
                  "Flat-rate boosts between two ranks, auto-combined to price any current → target range at the cheapest mix.",
                imageUrl: imageByMode.get("package"),
              }}
              variant="default"
              href="/shop/joki/package"
              footer={
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Flat-rate bundles
                </p>
              }
              action={
                <LinkButton
                  href="/shop/joki/package"
                  size="sm"
                  className="w-full"
                >
                  View
                </LinkButton>
              }
            />
          </ContentCardGrid>
        </section>

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
    </PageSkeleton>
  );
}
