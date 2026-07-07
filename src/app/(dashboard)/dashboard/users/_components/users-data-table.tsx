"use client";

import { DataTable } from "@components/shared/data-table";
import { ORG_ROLE_LABELS } from "@lib/labels";
import { ORG_ROLES } from "@server/db/schema";
import { createColumns } from "./columns";
import type { UserRow } from "./user-row-actions";

const roleFilterOptions = ORG_ROLES.map((value) => ({
  value,
  label: ORG_ROLE_LABELS[value],
}));

export function UsersDataTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  return (
    <DataTable
      columns={createColumns(currentUserId)}
      data={users}
      emptyMessage="No users yet."
      searchColumnId="search"
      searchPlaceholder="Search by name or email..."
      facetedFilters={[
        { columnId: "role", title: "Role", options: roleFilterOptions },
      ]}
    />
  );
}
