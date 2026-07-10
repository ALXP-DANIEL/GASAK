"use client";

import { DataTable } from "@components/shared/data-table";
import { columns } from "./columns";
import { MatchCard, type MatchRow } from "./match-card";

export function MatchesTable({
  rows,
  squadFilterOptions,
}: {
  rows: MatchRow[];
  squadFilterOptions: { value: string; label: string }[];
}) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage="No matches recorded yet."
      searchColumnId="opponent"
      searchPlaceholder="Search opponent or squad..."
      facetedFilters={[
        { columnId: "squad", title: "Squad", options: squadFilterOptions },
      ]}
      renderMobileCard={(match) => <MatchCard match={match} />}
    />
  );
}
