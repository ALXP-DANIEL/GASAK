import {
  ContentCardFrame,
  type ContentCardVariant,
  contentCardSize,
} from "@components/cards/shared";
import { Icons } from "@components/icons";
import { LinkButton } from "@components/ui/brand";
import { formatRM } from "@lib/format";
import { cn } from "@lib/utils";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Minimal shape ProductCard actually renders — a real `Product` row (or any
 * shop-listing item, e.g. a synthetic joki service) satisfies this
 * structurally, so callers aren't required to have a full DB row.
 */
export type ProductCardData = {
  name: string;
  priceSen: number;
  description?: string | null;
  imageUrl?: string | null;
  /** Shown in the default footer as "N in stock" — omit for non-stock items. */
  stock?: number;
};

export type ProductCardProps = {
  product: ProductCardData;
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
      className={cn(
        contentCardSize[variant],
        compact ? "h-72" : "h-[31rem]",
        className,
      )}
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
          compact ? "items-center p-5 text-center" : "p-6",
        )}
      >
        <h3
          className={cn(
            "text-balance font-heading font-semibold uppercase tracking-wide",
            compact
              ? "mt-1 line-clamp-2 min-h-12 text-lg leading-snug"
              : "line-clamp-2 min-h-16 text-2xl leading-8",
          )}
        >
          {product.name}
        </h3>

        <p
          className={cn(
            "font-mono font-semibold text-primary",
            compact ? "mt-1 text-sm" : "mt-1.5 text-lg",
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
            <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
              {product.description}
            </p>
            <div className="mt-auto pt-5">
              {footer ??
                (product.stock !== undefined && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {product.stock} in stock
                  </p>
                ))}
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
  product: ProductCardData;
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
