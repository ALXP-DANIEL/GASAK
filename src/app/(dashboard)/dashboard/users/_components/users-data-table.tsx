"use client";

import { DataTable } from "@components/shared/data-table";
import { EntityListCard } from "@components/shared/entity-list-card";
import { ORG_ROLE_LABELS } from "@lib/labels";
import { ORG_ROLES } from "@server/db/schema";
import { createColumns } from "./columns";
import {
  UserRoleSelect,
  type UserRow,
  UserRowActions,
} from "./user-row-actions";

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
      renderMobileCard={(user) => (
        <EntityListCard
          title={user.name}
          meta={[user.email, user.ign].filter(Boolean).join(" · ")}
        >
          <div className="flex items-center justify-between gap-3">
            <UserRoleSelect user={user} isSelf={user.id === currentUserId} />
            <UserRowActions user={user} isSelf={user.id === currentUserId} />
          </div>
        </EntityListCard>
      )}
    />
  );
}
