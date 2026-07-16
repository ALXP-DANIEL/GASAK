"use client";

import { DataTable } from "@components/shared/data-table";
import { EntityListCard } from "@components/shared/entity-list-card";
import { Badge } from "@components/ui/shadcn/badge";
import { formatRM } from "@lib/format";
import type { JokiPackage, JokiTier } from "@server/db/schema";
import { buildPackageColumns } from "./package-columns";

export function PackagesTable({
  rows,
  tiers,
}: {
  rows: JokiPackage[];
  tiers: JokiTier[];
}) {
  const tierName = (id: string | null) =>
    tiers.find((t) => t.id === id)?.name ?? "—";

  return (
    <DataTable
      columns={buildPackageColumns(tiers, rows)}
      data={rows}
      emptyMessage="No packages yet. Add your first flat-rate boost."
      renderMobileCard={(pkg) => (
        <EntityListCard
          title={pkg.name}
          meta={`${tierName(pkg.fromTierId)} → ${tierName(pkg.toTierId)} · ${formatRM(pkg.priceSen)}`}
          trailing={
            <Badge variant={pkg.active ? "default" : "outline"}>
              {pkg.active ? "Active" : "Hidden"}
            </Badge>
          }
        />
      )}
    />
  );
}
