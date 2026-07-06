import {
  ContentCardFrame,
  type ContentCardVariant,
  contentCardSize,
} from "@components/cards/shared";
import { Icons } from "@components/icons";
import { LinkButton } from "@components/ui/brand";
import { formatRM } from "@lib/format";
import { cn } from "@lib/utils";
import type { Product } from "@server/db/schema";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export type ProductCardProps = {
  product: Product;
  action?: ReactNode | false;
  href?: string;
  variant?: ContentCardVariant;
  meta?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function ProductCard({
  product,
  action,
  href,
  variant = "compact",
  meta,
  footer,
  className,
}: ProductCardProps) {
  const compact = variant === "compact";
  const hasLink = Boolean(href);

  return (
    <ContentCardFrame
      className={cn(contentCardSize[variant], className)}
      interactive={hasLink}
    >
      {href && (
        <Link
          href={href}
          aria-label={`View ${product.name}`}
          className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      )}

      <ProductImage product={product} compact={compact} />

      <div
        className={cn(
          "pointer-events-none relative z-20 flex flex-1 flex-col",
          compact ? "items-center p-4 text-center" : "p-6",
        )}
      >
        <h3
          className={cn(
            "text-balance font-heading font-semibold uppercase tracking-wide",
            compact
              ? "line-clamp-2 text-sm leading-snug"
              : "line-clamp-2 text-2xl leading-tight",
          )}
        >
          {product.name}
        </h3>

        <p
          className={cn(
            "mt-1.5 font-mono font-semibold text-primary",
            compact ? "text-sm" : "text-lg",
          )}
        >
          {formatRM(product.priceSen)}
        </p>

        {meta && (
          <div
            className={cn(
              "mt-3 flex flex-wrap gap-2",
              compact && "justify-center",
            )}
          >
            {meta}
          </div>
        )}

        {!compact && (
          <>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
            <div className="mt-auto pt-5">
              {footer ?? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {product.stock} in stock
                </p>
              )}
            </div>
          </>
        )}

        <div
          className={cn(
            "pointer-events-auto relative z-30",
            compact ? "mt-auto w-full pt-4" : "mt-4",
          )}
        >
          {renderProductAction({ action, href })}
        </div>
      </div>
    </ContentCardFrame>
  );
}

function ProductImage({
  product,
  compact,
}: {
  product: Product;
  compact: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none relative z-20 w-full overflow-hidden bg-secondary",
        compact ? "aspect-square" : "h-44",
      )}
    >
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Icons.Domain.Shop size={36} className="text-primary/50" />
        </div>
      )}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-card to-transparent"
      />
    </div>
  );
}

function renderProductAction({
  action,
  href,
}: {
  action: ProductCardProps["action"];
  href: ProductCardProps["href"];
}) {
  if (action === false || (href && action === undefined)) return null;

  return (
    action ?? (
      <LinkButton href="/shop" size="sm" className="w-full">
        Buy now
      </LinkButton>
    )
  );
}
