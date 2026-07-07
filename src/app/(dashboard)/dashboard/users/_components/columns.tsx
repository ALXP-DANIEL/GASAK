"use client";

import { Badge } from "@components/ui/shadcn/badge";
import type { ColumnDef } from "@tanstack/react-table";
import type { UserRow } from "./user-row-actions";
import { UserRoleSelect, UserRowActions } from "./user-row-actions";

export function createColumns(currentUserId: string): ColumnDef<UserRow>[] {
  return [
    {
      id: "search",
      accessorFn: (row) => `${row.name} ${row.email}`,
      header: "User",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {row.original.name}
            {row.original.id === currentUserId && (
              <Badge variant="secondary" className="ml-2">
                You
              </Badge>
            )}
            {row.original.banned && (
              <Badge variant="destructive" className="ml-2">
                Banned
              </Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      id: "ign",
      header: "IGN",
      cell: ({ row }) => row.original.ign ?? "-",
    },
    {
      id: "role",
      accessorFn: (row) => row.role,
      filterFn: "arrIncludesSome",
      header: "Role",
      cell: ({ row }) => (
        <UserRoleSelect
          user={row.original}
          isSelf={row.original.id === currentUserId}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <UserRowActions
          user={row.original}
          isSelf={row.original.id === currentUserId}
        />
      ),
    },
  ];
}
