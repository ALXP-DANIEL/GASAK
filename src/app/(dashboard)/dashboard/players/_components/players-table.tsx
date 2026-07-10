"use client";

import { DataTable } from "@components/shared/data-table";
import { EntityListCard } from "@components/shared/entity-list-card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/shadcn/avatar";
import { Badge } from "@components/ui/shadcn/badge";
import type { listPlayers } from "@features/players/queries";
import { initials } from "@lib/format";
import { formatLanes } from "@lib/labels";
import { formatRank } from "@lib/ranks";
import { columns } from "./columns";

type PlayerRow = Awaited<ReturnType<typeof listPlayers>>[number];

export function PlayersTable({
  rows,
  laneFilterOptions,
}: {
  rows: PlayerRow[];
  laneFilterOptions: { value: string; label: string }[];
}) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage="No player profiles yet."
      searchColumnId="name"
      searchPlaceholder="Search by name or IGN..."
      facetedFilters={[
        { columnId: "lane", title: "Lane", options: laneFilterOptions },
      ]}
      renderMobileCard={(player) => (
        <EntityListCard
          href={`/dashboard/players/${player.userId}`}
          title={player.user.name}
          meta={[
            player.ign,
            player.preferredLanes && player.preferredLanes.length > 0
              ? formatLanes(player.preferredLanes)
              : undefined,
          ]
            .filter(Boolean)
            .join(" · ")}
          leading={
            <Avatar className="size-9">
              <AvatarImage
                src={player.user.image ?? undefined}
                alt={player.user.name}
              />
              <AvatarFallback>{initials(player.user.name)}</AvatarFallback>
            </Avatar>
          }
          trailing={
            player.currentRank ? (
              <Badge variant="secondary">
                {formatRank(player.currentRank)}
              </Badge>
            ) : undefined
          }
        />
      )}
    />
  );
}
