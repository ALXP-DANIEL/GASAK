import { ProductCard } from "@/components/old/public/content-cards";
import { LinkButton, SectionHeader } from "@/components/ui/brand";
import type { Product } from "@/server/db/schema";

export function ProductsSection({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section id="shop" className="mx-auto w-full max-w-7xl px-4 py-14 lg:px-8">
      <SectionHeader eyebrow="Shop Now" title="Top products" />

      <div className="mt-10 grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <LinkButton href="/shop" caret>
          View all products
        </LinkButton>
      </div>
    </section>
  );
}
