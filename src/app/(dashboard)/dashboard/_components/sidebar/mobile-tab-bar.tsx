"use client";

import { Icons } from "@components/icons";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@components/ui/shadcn/drawer";
import {
  canAccessDashboardItem,
  type DashboardAccess,
  type DashboardNavItem,
  dashboardSidebarGroups,
} from "@config/dashboard";
import { cn } from "@lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { resolveDashboardAccess } from "./sidebar-focus";
import { useSidebarFocus } from "./sidebar-focus-toggle";

/** Order of preference for the 3 quick slots between Home and More. */
const TAB_PRIORITY = [
  "/dashboard/schedules",
  "/dashboard/matches",
  "/dashboard/my-squad",
  "/dashboard/orders",
  "/dashboard/products",
  "/dashboard/tournaments",
  "/dashboard/squads",
  "/dashboard/recruitment",
  "/dashboard/reports",
];

export function MobileTabBar({ access }: { access: DashboardAccess }) {
  const pathname = usePathname();
  const [focus] = useSidebarFocus();
  const [moreOpen, setMoreOpen] = useState(false);
  const effectiveAccess = resolveDashboardAccess(access, focus);

  // Close the More drawer on navigation
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname change is the close signal
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const allItems = dashboardSidebarGroups.flatMap((group) =>
    group.items.filter((item) => canAccessDashboardItem(item, effectiveAccess)),
  );
  const home = allItems.find((item) => item.href === "/dashboard");
  const quick = TAB_PRIORITY.map((href) =>
    allItems.find((item) => item.href === href),
  )
    .filter((item): item is DashboardNavItem => Boolean(item))
    .slice(0, 3);
  const tabHrefs = new Set(["/dashboard", ...quick.map((item) => item.href)]);
  const moreItems = allItems.filter((item) => !tabHrefs.has(item.href));

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  const moreActive = moreItems.some((item) => isActive(item.href));

  return (
    <nav
      aria-label="Dashboard quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur desktop:hidden"
    >
      <div className="grid auto-cols-fr grid-flow-col">
        {home && <TabLink item={home} active={isActive("/dashboard")} />}
        {quick.map((item) => (
          <TabLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
        <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex flex-col items-center gap-0.5 px-1 py-2 text-[0.65rem] font-medium",
                moreActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icons.Layout.Navigation.Menu size={20} />
              More
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>All destinations</DrawerTitle>
              <DrawerDescription>
                Everything you can access in the dashboard.
              </DrawerDescription>
            </DrawerHeader>
            <div className="grid grid-cols-3 gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1.5 border px-2 py-3 text-center text-xs font-medium",
                    isActive(item.href)
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "bg-card text-foreground/80",
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              ))}
              <Link
                href="/dashboard/settings"
                className={cn(
                  "flex flex-col items-center gap-1.5 border px-2 py-3 text-center text-xs font-medium",
                  isActive("/dashboard/settings")
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "bg-card text-foreground/80",
                )}
              >
                <Icons.Actions.Settings size={20} />
                Settings
              </Link>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}

function TabLink({
  item,
  active,
}: {
  item: DashboardNavItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center gap-0.5 px-1 py-2 text-[0.65rem] font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <item.icon size={20} weight={active ? "fill" : "regular"} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
