"use client";

import { Icons } from "@components/icons";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@components/ui/shadcn/command";
import { Kbd } from "@components/ui/shadcn/kbd";
import {
  canAccessDashboardItem,
  type DashboardAccess,
  dashboardSidebarGroups,
} from "@config/dashboard";
import type { Icon } from "@phosphor-icons/react";
import {
  globalSearch,
  type SearchResult,
  type SearchResultType,
} from "@server/actions/search";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { resolveDashboardAccess } from "./sidebar/sidebar-focus";
import { useSidebarFocus } from "./sidebar/sidebar-focus-toggle";

const TYPE_META: Record<SearchResultType, { label: string; icon: Icon }> = {
  player: { label: "Players", icon: Icons.Stats.Players },
  squad: { label: "Squads", icon: Icons.Domain.Squads },
  tournament: { label: "Tournaments", icon: Icons.Stats.Trophies },
  match: { label: "Matches", icon: Icons.Domain.Scrims },
  news: { label: "News", icon: Icons.Domain.News },
  product: { label: "Products", icon: Icons.Domain.Products },
  order: { label: "Orders", icon: Icons.Domain.Orders },
  user: { label: "Users", icon: Icons.Domain.Accounts },
};

const TYPE_ORDER: SearchResultType[] = [
  "player",
  "squad",
  "tournament",
  "match",
  "news",
  "product",
  "order",
  "user",
];

export function CommandPalette({ access }: { access: DashboardAccess }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [focus] = useSidebarFocus();
  const effectiveAccess = resolveDashboardAccess(access, focus);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const trimmed = query.trim();
  const searching = trimmed.length >= 2;

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    const handle = setTimeout(async () => {
      const found = await globalSearch(trimmed);
      // Ignore stale responses if the query changed while this was in flight.
      if (id === requestId.current) {
        setResults(found);
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [trimmed]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const groups = dashboardSidebarGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canAccessDashboardItem(item, effectiveAccess),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const groupedResults = useMemo(() => {
    const map = new Map<SearchResultType, SearchResult[]>();
    for (const result of results) {
      const list = map.get(result.type) ?? [];
      list.push(result);
      map.set(result.type, list);
    }
    return map;
  }, [results]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto hidden items-center gap-2 border bg-muted/40 px-2.5 py-1.5 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground desktop:flex"
      >
        Search
        <Kbd>⌘K</Kbd>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setQuery("");
        }}
        title="Search"
        description="Find players, squads, tournaments, matches, news, products, orders, and more"
      >
        <Command>
          <CommandInput
            placeholder="Search the app..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {searching ? (
              loading ? (
                <CommandEmpty>Searching…</CommandEmpty>
              ) : results.length === 0 ? (
                <CommandEmpty>No results found.</CommandEmpty>
              ) : (
                TYPE_ORDER.filter((type) => groupedResults.has(type)).map(
                  (type) => (
                    <CommandGroup key={type} heading={TYPE_META[type].label}>
                      {(groupedResults.get(type) ?? []).map((result) => {
                        const TypeIcon = TYPE_META[type].icon;
                        return (
                          <CommandItem
                            key={`${result.type}-${result.id}`}
                            value={`${result.title} ${result.subtitle ?? ""} ${TYPE_META[type].label}`}
                            onSelect={() => go(result.href)}
                          >
                            <TypeIcon className="mr-2 size-4" />
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate">{result.title}</span>
                              {result.subtitle ? (
                                <span className="truncate text-xs text-muted-foreground">
                                  {result.subtitle}
                                </span>
                              ) : null}
                            </span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ),
                )
              )
            ) : (
              <>
                {groups.map((group) => (
                  <CommandGroup
                    key={group.id}
                    heading={group.label ?? "General"}
                  >
                    {group.items.map((item) => (
                      <CommandItem
                        key={item.href}
                        value={item.label}
                        onSelect={() => go(item.href)}
                      >
                        <item.icon className="mr-2 size-4" />
                        {item.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
                <CommandGroup heading="Account">
                  <CommandItem
                    value="Profile"
                    onSelect={() => go("/dashboard/profile")}
                  >
                    Profile
                  </CommandItem>
                  <CommandItem
                    value="Settings"
                    onSelect={() => go("/dashboard/settings")}
                  >
                    Settings
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
