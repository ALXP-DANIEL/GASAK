"use client";

import { EmptyState } from "@app/(dashboard)/dashboard/_components/page-surface";
import { Icons } from "@components/icons";
import { Badge } from "@components/ui/shadcn/badge";
import { Button } from "@components/ui/shadcn/button";
import { Card, CardContent } from "@components/ui/shadcn/card";
import { Checkbox } from "@components/ui/shadcn/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@components/ui/shadcn/command";
import { Input } from "@components/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/shadcn/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/shadcn/table";
import type {
  Column,
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

export type FacetedFilterConfig = {
  columnId: string;
  title: string;
  options: { label: string; value: string }[];
};

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage,
  searchColumnId,
  searchPlaceholder = "Search...",
  facetedFilters,
  initialColumnVisibility,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage: string;
  /** Column id to wire the search input to, e.g. a hidden combined-field column. */
  searchColumnId?: string;
  searchPlaceholder?: string;
  /** Dropdown checkbox filters, e.g. filter products by category. */
  facetedFilters?: FacetedFilterConfig[];
  initialColumnVisibility?: VisibilityState;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  );
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const searchColumn = searchColumnId
    ? table.getColumn(searchColumnId)
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      {(searchColumn || facetedFilters?.length) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchColumn && (
            <Input
              placeholder={searchPlaceholder}
              value={(searchColumn.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                searchColumn.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          )}
          {facetedFilters?.map((filter) => (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={table.getColumn(filter.columnId)}
              title={filter.title}
              options={filter.options}
            />
          ))}
          {table.getState().columnFilters.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => table.resetColumnFilters()}
            >
              Reset
              <Icons.Layout.Navigation.Close />
            </Button>
          )}
        </div>
      )}
      <Card>
        <CardContent>
          {data.length === 0 ? (
            <EmptyState message={emptyMessage} />
          ) : table.getRowModel().rows.length === 0 ? (
            <EmptyState message="No results match your search." />
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DataTableFacetedFilter<TData>({
  column,
  title,
  options,
}: {
  column: Column<TData, unknown> | undefined;
  title: string;
  options: { label: string; value: string }[];
}) {
  const selected = new Set((column?.getFilterValue() as string[]) ?? []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          {title}
          {selected.size > 0 && (
            <Badge variant="secondary" className="ml-1 rounded-sm px-1">
              {selected.size}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      const next = new Set(selected);
                      if (isSelected) {
                        next.delete(option.value);
                      } else {
                        next.add(option.value);
                      }
                      column?.setFilterValue(
                        next.size ? Array.from(next) : undefined,
                      );
                    }}
                  >
                    <Checkbox checked={isSelected} className="mr-2" />
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: {
    toggleSorting: (desc?: boolean) => void;
    getIsSorted: () => false | "asc" | "desc";
  };
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-1 font-medium hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      {column.getIsSorted() === "asc" && " ↑"}
      {column.getIsSorted() === "desc" && " ↓"}
    </button>
  );
}
