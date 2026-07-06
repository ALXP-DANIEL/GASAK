import { ProductPurchasePanel } from "@components/cards";
import { Icons } from "@components/icons";
import { BrandBadge, BrandCard, LinkButton } from "@components/ui/brand";
import { formatRM } from "@lib/format";
import { PRODUCT_CATEGORY_LABELS } from "@lib/labels";
import { createPageMetadata } from "@lib/metadata";
import { db, products } from "@server/db";
import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getProduct(productId: string) {
  return db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      options: { with: { values: true } },
      variants: { with: { optionValues: { with: { optionValue: true } } } },
    },
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
    path: `/shop/${product.id}`,
    type: "Product",
    image: product.imageUrl,
    meta: product.hasVariants
      ? `From ${formatRM(product.priceSen)} · ${PRODUCT_CATEGORY_LABELS[product.category]}`
      : `${formatRM(product.priceSen)} · ${PRODUCT_CATEGORY_LABELS[product.category]}`,
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
  const categoryLabel = PRODUCT_CATEGORY_LABELS[product.category];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 desktop:px-8 desktop:py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <LinkButton href="/shop" size="sm">
          Back to shop
        </LinkButton>
      </div>

      <section className="grid gap-6 desktop:grid-cols-[minmax(20rem,30rem)_minmax(0,1fr)]">
        <BrandCard
          interactive={false}
          className="relative aspect-square overflow-hidden bg-secondary"
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 768px) 30rem, calc(100vw - 2rem)"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="grid h-full place-items-center">
              <Icons.Domain.Shop size={64} className="text-primary/45" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background/80 to-transparent" />
        </BrandCard>

        <BrandCard interactive={false} className="p-5 desktop:p-7">
          <BrandBadge>{categoryLabel}</BrandBadge>
          <h1 className="mt-4 text-balance font-heading text-3xl font-bold uppercase leading-tight tracking-wide text-foreground desktop:text-5xl">
            {product.name}
          </h1>

          <div className="mt-5">
            <ProductPurchasePanel product={product} />
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            <PurchaseRow label="Delivery">
              <span className="text-muted-foreground">
                MLBB ID or WhatsApp after payment
              </span>
            </PurchaseRow>
            <PurchaseRow label="Checkout">
              <span className="text-muted-foreground">
                Guest order, no account required
              </span>
            </PurchaseRow>
          </div>
        </BrandCard>
      </section>

      <section className="mt-6 grid gap-6 desktop:grid-cols-[minmax(0,1fr)_24rem]">
        <BrandCard interactive={false} className="p-5 desktop:p-7">
          <h2 className="font-heading text-xl font-bold uppercase tracking-wide">
            Product details
          </h2>
          <div className="mt-5 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
            <ProductFact label="Category" value={categoryLabel} />
            {!product.hasVariants && (
              <ProductFact label="Price" value={formatRM(product.priceSen)} />
            )}
          </div>

          <h2 className="mt-8 font-heading text-xl font-bold uppercase tracking-wide">
            Description
          </h2>
          <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-muted-foreground desktop:text-base">
            {product.description ?? "Available from GASAK Shop."}
          </p>
        </BrandCard>

        <BrandCard interactive={false} className="h-fit p-5">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider">
            What happens next
          </h2>
          <div className="mt-5 grid gap-3 text-xs text-muted-foreground">
            <CheckoutNote
              icon={<Icons.Status.Success size={16} />}
              text="Guest checkout, no account required."
            />
            <CheckoutNote
              icon={<Icons.Domain.Orders size={16} />}
              text="Order tracking is available after checkout."
            />
            <CheckoutNote
              icon={<Icons.Domain.Lightning size={16} />}
              text="Delivery is handled through your MLBB ID or WhatsApp after payment."
            />
          </div>
        </BrandCard>
      </section>
    </main>
  );
}

function ProductFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-card/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function PurchaseRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 desktop:grid-cols-[7rem_1fr]">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function CheckoutNote({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-primary">{icon}</span>
      <span className="leading-5">{text}</span>
    </div>
  );
}
