"use client";

import { DeleteButton } from "@components/shared/delete-button";
import { Badge } from "@components/ui/shadcn/badge";
import { deleteAuthSlide } from "@server/actions/auth-slides";
import type { AuthSlide } from "@server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { AuthSlideFormDialog } from "./auth-slide-form";

export const columns: ColumnDef<AuthSlide>[] = [
  {
    id: "image",
    header: "",
    cell: ({ row }) => (
      <div className="relative size-12 overflow-hidden rounded border">
        <Image
          src={row.original.imageUrl}
          alt={row.original.title}
          fill
          sizes="48px"
          className="object-cover"
          unoptimized
        />
      </div>
    ),
  },
  {
    id: "title",
    accessorFn: (row) => `${row.title} ${row.eyebrow}`,
    header: "Title",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {row.original.eyebrow}
        </p>
        <p className="line-clamp-2 font-medium">{row.original.title}</p>
      </div>
    ),
  },
  {
    id: "sortOrder",
    header: "Sort order",
    cell: ({ row }) => row.original.sortOrder,
  },
  {
    id: "status",
    accessorFn: (row) => (row.active ? "active" : "hidden"),
    filterFn: "arrIncludesSome",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.active ? "default" : "outline"}>
        {row.original.active ? "Active" : "Hidden"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <AuthSlideFormDialog slide={row.original} />
        <DeleteButton
          action={deleteAuthSlide.bind(null, row.original.id)}
          title="Delete slide?"
          description={`This will remove "${row.original.title}" from the auth carousel.`}
        />
      </div>
    ),
  },
];
