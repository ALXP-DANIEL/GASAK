"use client";

import {
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resolveDashboardAccess } from "./sidebar/sidebar-focus";
import { useSidebarFocus } from "./sidebar/sidebar-focus-toggle";

export function CommandPalette({ access }: { access: DashboardAccess }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [focus] = useSidebarFocus();
  const effectiveAccess = resolveDashboardAccess(access, focus);

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

  function go(href: string) {
    setOpen(false);
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
        onOpenChange={setOpen}
        title="Go to"
        description="Jump to any dashboard destination"
      >
        <CommandInput placeholder="Go to..." />
        <CommandList>
          <CommandEmpty>No destination found.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.id} heading={group.label ?? "General"}>
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
              value="Settings"
              onSelect={() => go("/dashboard/settings")}
            >
              Settings
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
