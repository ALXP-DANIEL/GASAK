"use client";

import { DataTable } from "@components/shared/data-table";
import { columns } from "./columns";
import { TournamentCard, type TournamentRow } from "./tournament-card";

export function TournamentsAllTable({
  rows,
  squadFilterOptions,
}: {
  rows: TournamentRow[];
  squadFilterOptions: { value: string; label: string }[];
}) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage="No tournaments recorded yet."
      searchColumnId="name"
      searchPlaceholder="Search tournaments..."
      facetedFilters={[
        { columnId: "squad", title: "Squad", options: squadFilterOptions },
      ]}
      renderMobileCard={(tournament) => (
        <TournamentCard tournament={tournament} />
      )}
    />
  );
}
