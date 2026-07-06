"use client";

import { BuyButton } from "@components/cards/product/buy-button";
import { Badge } from "@components/ui/shadcn/badge";
import { Button } from "@components/ui/shadcn/button";
import { formatRM } from "@lib/format";
import { cn } from "@lib/utils";
import type {
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "@server/db/schema";
import { useMemo, useState } from "react";

export type ProductWithVariants = Product & {
  options: (ProductOption & { values: ProductOptionValue[] })[];
  variants: (ProductVariant & {
    optionValues: { optionValue: ProductOptionValue }[];
  })[];
};

export function ProductPurchasePanel({
  product,
}: {
  product: ProductWithVariants;
}) {
  const sortedOptions = useMemo(
    () =>
      [...product.options]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((option) => ({
          ...option,
          values: [...option.values].sort((a, b) => a.sortOrder - b.sortOrder),
        })),
    [product.options],
  );

  const [selected, setSelected] = useState<Record<string, string>>({});

  const selectedVariant = useMemo(() => {
    if (!product.hasVariants) return null;
    if (sortedOptions.some((option) => !selected[option.id])) return null;

    return product.variants.find((variant) => {
      const values = variant.optionValues.map((v) => v.optionValue);
      return sortedOptions.every((option) => {
        const value = values.find((v) =>
          option.values.some((ov) => ov.id === v.id),
        );
        return value?.value === selected[option.id];
      });
    });
  }, [product.hasVariants, product.variants, sortedOptions, selected]);

  const priceSen = selectedVariant
    ? selectedVariant.priceSen
    : product.hasVariants
      ? Math.min(...product.variants.map((v) => v.priceSen), product.priceSen)
      : product.priceSen;
  const stock = selectedVariant
    ? selectedVariant.stock
    : product.hasVariants
      ? 0
      : product.stock;
  const inStock = stock > 0;
  const needsSelection = product.hasVariants && !selectedVariant;

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-secondary/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {product.hasVariants && !selectedVariant ? "From" : "Price"}
        </p>
        <p className="mt-1 font-mono text-3xl font-semibold text-primary desktop:text-4xl">
          {formatRM(priceSen)}
        </p>
      </div>

      {sortedOptions.map((option) => (
        <div key={option.id} className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {option.name}
          </span>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => (
              <Button
                key={value.id}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  selected[option.id] === value.value &&
                    "border-primary bg-primary/10 text-primary",
                )}
                onClick={() =>
                  setSelected((prev) => ({
                    ...prev,
                    [option.id]: value.value,
                  }))
                }
              >
                {value.value}
              </Button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Stock
        </span>
        {needsSelection ? (
          <Badge variant="outline">Select options</Badge>
        ) : (
          <Badge variant={inStock ? "secondary" : "outline"}>
            {inStock ? `${stock} ready` : "Out of stock"}
          </Badge>
        )}
      </div>

      <div className="max-w-sm">
        {needsSelection ? (
          <Button disabled className="w-full">
            Select options to continue
          </Button>
        ) : inStock ? (
          <BuyButton
            product={product}
            variantId={selectedVariant?.id}
            unitPriceSen={priceSen}
          />
        ) : (
          <Button disabled className="w-full">
            Out of stock
          </Button>
        )}
      </div>
    </div>
  );
}
