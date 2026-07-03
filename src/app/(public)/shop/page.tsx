import { and, eq, gt } from "drizzle-orm";
import Image from "next/image";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { formatRM } from "@/lib/format";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">GASAK Shop</h1>
          <p className="mt-2 text-muted-foreground">
            Diamonds, weekly passes, joki, and coaching — guest checkout, pay by
            DuitNow QR or bank transfer.
          </p>
        </div>
        <OrderLookup />
      </div>

      {byCategory.map(({ category, items: group }) => (
        <section key={category} className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">
            {PRODUCT_CATEGORY_LABELS[category]}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.map((product) => (
              <Card key={product.id} className="flex h-full flex-col">
                {product.imageUrl && (
                  <div className="relative h-36 w-full overflow-hidden rounded-t-xl">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    <Badge variant="secondary">
                      {formatRM(product.priceSen)}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto text-xs text-muted-foreground">
                  {product.stock} in stock
                </CardContent>
                <CardFooter>
                  <BuyButton product={product} />
                </CardFooter>
              </Card>
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
