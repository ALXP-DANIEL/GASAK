"use client";

import { Badge } from "@components/ui/shadcn/badge";
import { formatDateTime } from "@lib/format";
import type { News, Squad, User } from "@server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

export type NewsRow = News & {
  squad: Squad | null;
  author: User | null;
  isUnread: boolean;
};

export const columns: ColumnDef<NewsRow>[] = [
  {
    id: "title",
    accessorFn: (row) => row.title,
    header: "Title",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.isUnread && (
          <span className="size-2 shrink-0 rounded-full bg-primary" />
        )}
        <Link
          href={`/dashboard/news/${row.original.id}`}
          className="line-clamp-1 font-medium hover:underline"
        >
          {row.original.title}
        </Link>
      </div>
    ),
  },
  {
    id: "squad",
    accessorFn: (row) => row.squad?.name ?? "Global",
    filterFn: "arrIncludesSome",
    header: "Squad",
    cell: ({ row }) => (
      <Badge variant={row.original.squad ? "outline" : "default"}>
        {row.original.squad?.name ?? "Global"}
      </Badge>
    ),
  },
  {
    id: "author",
    header: "Author",
    cell: ({ row }) => row.original.author?.name ?? "Unknown",
  },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
];
