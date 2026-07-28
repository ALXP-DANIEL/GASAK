"use client";

import { DataTable } from "@components/shared/data-table";
import { EntityListCard } from "@components/shared/entity-list-card";
import { Badge } from "@components/ui/shadcn/badge";
import { formatRM, formatWinRate } from "@lib/format";
import { formatRank } from "@lib/ranks";
import type { AccountProduct } from "@server/db/schema";
import Image from "next/image";
import { accountColumns } from "./account-columns";

export function AccountTable({ rows }: { rows: AccountProduct[] }) {
  return (
    <DataTable
      columns={accountColumns}
      data={rows}
      emptyMessage="No account listings yet. Add your first one."
      searchColumnId="name"
      searchPlaceholder="Search accounts..."
      renderMobileCard={(product) => (
        <EntityListCard
          href={`/dashboard/products/${product.id}`}
          title={product.name}
          meta={[
            formatRM(product.priceSen),
            product.accountDetails?.rank &&
              formatRank(product.accountDetails.rank),
            product.accountDetails?.winRate != null &&
              `WR ${formatWinRate(product.accountDetails.winRate)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
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
            product.accountDetails?.sold ? (
              <Badge variant="secondary">Sold</Badge>
            ) : (
              <Badge variant={product.active ? "default" : "outline"}>
                {product.active ? "Available" : "Hidden"}
              </Badge>
            )
          }
        />
      )}
    />
  );
}
