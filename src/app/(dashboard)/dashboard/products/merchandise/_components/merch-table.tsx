"use client";

import { DataTable } from "@components/shared/data-table";
import { EntityListCard } from "@components/shared/entity-list-card";
import { Badge } from "@components/ui/shadcn/badge";
import { formatRM } from "@lib/format";
import type { Product } from "@server/db/schema";
import Image from "next/image";
import { merchColumns } from "./merch-columns";

export function MerchTable({ rows }: { rows: Product[] }) {
  return (
    <DataTable
      columns={merchColumns}
      data={rows}
      emptyMessage="No merch items yet. Add your first product."
      searchColumnId="name"
      searchPlaceholder="Search merch..."
      renderMobileCard={(product) => (
        <EntityListCard
          href={`/dashboard/products/${product.id}`}
          title={product.name}
          meta={`${
            product.hasVariants
              ? `from ${formatRM(product.priceSen)}`
              : formatRM(product.priceSen)
          } · ${product.stock} in stock`}
          leading={
            product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={40}
                height={40}
                className="size-10 rounded-none border object-cover"
              />
            ) : (
              <div className="grid size-10 place-items-center rounded-none border bg-muted text-xs text-muted-foreground">
                {product.name.slice(0, 2).toUpperCase()}
              </div>
            )
          }
          trailing={
            <Badge variant={product.active ? "default" : "outline"}>
              {product.active ? "Active" : "Hidden"}
            </Badge>
          }
        />
      )}
    />
  );
}
