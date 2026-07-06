import { BuyButton, ProductCard } from "@components/cards";
import { LinkButton, PageHero } from "@components/ui/brand";
import { Badge } from "@components/ui/shadcn/badge";
import { PRODUCT_CATEGORY_LABELS } from "@lib/labels";
import { createPageMetadata } from "@lib/metadata";
import { db, products } from "@server/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getProduct(productId: string) {
  return db.query.products.findFirst({
    where: eq(products.id, productId),
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) return {};

  return createPageMetadata({
    title: product.name,
    description: product.description ?? "GASAK shop product.",
    path: `/pricing/${product.id}`,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product?.active) notFound();

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 desktop:grid-cols-[minmax(0,24rem)_1fr] desktop:px-8 desktop:py-14">
      <ProductCard product={product} variant="default" action={false} />

      <div className="flex flex-col justify-center gap-6">
        <PageHero
          align="left"
          eyebrow={PRODUCT_CATEGORY_LABELS[product.category]}
          title={product.name}
          description={product.description ?? "Available from GASAK Shop."}
        >
          <Badge variant={product.stock > 0 ? "default" : "outline"}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </Badge>
        </PageHero>

        <div className="flex flex-wrap gap-3">
          <div className="w-full max-w-xs">
            <BuyButton product={product} />
          </div>
          <LinkButton href="/pricing">Back to pricing</LinkButton>
        </div>
      </div>
    </main>
  );
}
