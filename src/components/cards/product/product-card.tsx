import {
  ContentCardFrame,
  type ContentCardVariant,
  contentCardSize,
} from "@components/cards/shared";
import { Icons } from "@components/icons";
import { BrandBadge, LinkButton } from "@components/ui/brand";
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
      className={cn(
        "relative",
        contentCardSize[variant],
        compact && "items-center p-5 text-center",
        hasLink && "transition-colors hover:border-primary/60",
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
          compact ? "w-full items-center" : "p-5",
        )}
      >
        <ProductHeader product={product} compact={compact} />

        {meta && <div className="mt-3 flex flex-wrap gap-2">{meta}</div>}

        {!compact && (
          <>
            <p className="mt-2 line-clamp-3 min-h-18 text-sm leading-6 text-muted-foreground">
              {product.description}
            </p>

            <div className="mt-auto pt-5">
              {footer ?? (
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {product.stock} in stock
                </p>
              )}
            </div>
          </>
        )}

        <div
          className={cn(
            "pointer-events-auto relative z-30",
            compact ? "mt-auto w-full pt-3" : "mt-4",
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
        "pointer-events-none relative z-20 flex items-center justify-center overflow-hidden",
        compact ? "size-16 desktop:size-20" : "h-36 w-full",
      )}
    >
      {product.imageUrl ? (
        compact ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={80}
            height={80}
            className="size-full object-contain"
            unoptimized
          />
        ) : (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
          />
        )
      ) : (
        <Icons.Domain.Shop size={40} className="text-primary/50" />
      )}
    </div>
  );
}

function ProductHeader({
  product,
  compact,
}: {
  product: Product;
  compact: boolean;
}) {
  return (
    <div
      className={cn(
        compact ? "contents" : "flex items-center justify-between gap-2",
      )}
    >
      <h3
        className={cn(
          "font-heading font-bold tracking-wide",
          compact
            ? "mt-3 line-clamp-2 min-h-10 text-xs leading-5 uppercase desktop:text-sm"
            : "line-clamp-2 min-h-14 text-xl leading-7",
        )}
      >
        {product.name}
      </h3>

      {compact ? (
        <p className="mt-1 text-[11px] font-semibold text-primary desktop:text-xs">
          {formatRM(product.priceSen)}
        </p>
      ) : (
        <BrandBadge>{formatRM(product.priceSen)}</BrandBadge>
      )}
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
      <LinkButton href="/pricing" size="sm" className="w-full">
        Buy now
      </LinkButton>
    )
  );
}
