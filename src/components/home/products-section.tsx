import { ContentCardGrid } from "@components/cards";
import { BuyButton } from "@components/products/buy-button";
import { ProductCard } from "@components/products/product-card";
import { LinkButton, SectionHeader } from "@components/ui/brand";
import type { Product } from "@server/db/schema";

export function ProductsSection({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section
      id="shop"
      className="mx-auto w-full max-w-7xl px-4 py-14 desktop:px-8"
    >
      <SectionHeader eyebrow="Shop Now" title="Top products" />

      <ContentCardGrid className="mt-10">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variant="compact"
            href={`/pricing/${product.id}`}
            action={<BuyButton product={product} />}
          />
        ))}
      </ContentCardGrid>

      <div className="mt-8 flex justify-center">
        <LinkButton href="/pricing" caret>
          View all products
        </LinkButton>
      </div>
    </section>
  );
}
