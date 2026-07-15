"use client";

import { DataTable } from "@components/shared/data-table";
import { EntityListCard } from "@components/shared/entity-list-card";
import { Badge } from "@components/ui/shadcn/badge";
import { formatRM } from "@lib/format";
import type { JokiTier } from "@server/db/schema";
import { buildTierColumns } from "./tier-columns";

export function TiersTable({ rows }: { rows: JokiTier[] }) {
  return (
    <DataTable
      columns={buildTierColumns(rows.map((t) => t.name))}
      data={rows}
      emptyMessage="No tiers yet. Add your first rank tier."
      renderMobileCard={(tier) => (
        <EntityListCard
          title={tier.name}
          meta={`${formatRM(tier.pricePerStarSen)} / ⭐`}
          trailing={
            <Badge variant={tier.active ? "default" : "outline"}>
              {tier.active ? "Active" : "Hidden"}
            </Badge>
          }
        />
      )}
    />
  );
}
