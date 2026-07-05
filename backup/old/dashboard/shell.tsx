"use client";

import type { Icon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { authClient } from "@/lib/auth-client";
import { ROLE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Role } from "@/server/db/schema";

type NavItem = {
  href: string;
  label: string;
  Icon: Icon;
  roles: Role[];
  group: "main" | "shop" | "system";
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/old/dashboard",
    label: "Overview",
    Icon: Icons.Domain.Squads,
    roles: ["admin", "leader", "member", "seller"],
    group: "main",
  },
  {
    href: "/old/dashboard/squads",
    label: "Squads",
    Icon: Icons.Stats.Squads,
    roles: ["admin"],
    group: "main",
  },
  {
    href: "/old/dashboard/my-squad",
    label: "My Squad",
    Icon: Icons.Stats.Squads,
    roles: ["leader", "member"],
    group: "main",
  },
  {
    href: "/old/dashboard/players",
    label: "Players",
    Icon: Icons.Domain.Members,
    roles: ["admin", "leader"],
    group: "main",
  },
  {
    href: "/old/dashboard/recruitment",
    label: "Recruitment",
    Icon: Icons.Domain.Recruitment,
    roles: ["admin", "leader"],
    group: "main",
  },
  {
    href: "/old/dashboard/calendar",
    label: "Calendar",
    Icon: Icons.Domain.Calendar,
    roles: ["admin", "leader", "member"],
    group: "main",
  },
  {
    href: "/old/dashboard/tournaments",
    label: "Tournaments",
    Icon: Icons.Stats.Trophies,
    roles: ["admin", "leader", "member"],
    group: "main",
  },
  {
    href: "/old/dashboard/scrims",
    label: "Scrims",
    Icon: Icons.Domain.Scrims,
    roles: ["admin", "leader", "member"],
    group: "main",
  },
  {
    href: "/old/dashboard/announcements",
    label: "Announcements",
    Icon: Icons.Domain.Announcements,
    roles: ["admin", "leader", "member"],
    group: "main",
  },
  {
    href: "/old/dashboard/products",
    label: "Products",
    Icon: Icons.Domain.Products,
    roles: ["admin", "seller"],
    group: "shop",
  },
  {
    href: "/old/dashboard/orders",
    label: "Orders",
    Icon: Icons.Domain.Orders,
    roles: ["admin", "seller"],
    group: "shop",
  },
  {
    href: "/old/dashboard/users",
    label: "Users",
    Icon: Icons.Domain.Players,
    roles: ["admin"],
    group: "system",
  },
  {
    href: "/old/dashboard/profile",
    label: "My Profile",
    Icon: Icons.Stats.Players,
    roles: ["admin", "leader", "member", "seller"],
    group: "system",
  },
];

const GROUP_LABELS = {
  main: "Main",
  shop: "Shop",
  system: "System",
} as const;

type ShellUser = {
  name: string;
  email: string;
  role: Role;
};

function SidebarContent({
  user,
  onNavigate,
}: {
  user: ShellUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const grouped = (["main", "shop", "system"] as const).map((group) => ({
    group,
    items: items.filter((item) => item.group === group),
  }));

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/old/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        className="flex h-[70px] items-center gap-3 border-b border-primary/15 px-5 text-foreground"
        onClick={onNavigate}
      >
        <Image
          src="/images/gasak-logo.png"
          alt="GASAK ESPORT"
          width={44}
          height={44}
          className="size-11 rounded-full object-cover"
        />
        <span className="flex flex-col leading-none">
          <span className="font-heading text-2xl font-bold tracking-widest text-primary">
            GASAK
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.45em] text-muted-foreground">
            Esport
          </span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
        {grouped.map(
          ({ group, items: groupItems }) =>
            groupItems.length > 0 && (
              <div key={group} className="grid gap-1.5">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {GROUP_LABELS[group]}
                </p>
                {groupItems.map(({ href, label, Icon }) => {
                  const active =
                    href === "/old/dashboard"
                      ? pathname === "/old/dashboard"
                      : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm transition-colors",
                        active
                          ? "border-primary/35 bg-primary/45 text-primary-foreground shadow-[0_0_24px_oklch(0.78_0.14_85_/_0.18)]"
                          : "text-muted-foreground hover:border-primary/20 hover:bg-primary/10 hover:text-foreground",
                      )}
                    >
                      <Icon size={17} weight={active ? "fill" : "regular"} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            ),
        )}
      </nav>

      <div className="m-3 rounded-lg border border-primary/20 bg-background/55 p-3">
        <div className="flex items-center gap-3">
          <Image
            src="/images/gasak-logo.png"
            alt=""
            width={48}
            height={48}
            className="size-12 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">
              GASAK ESPORT
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Dominate as GASAK.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={handleSignOut}
        >
          <Icons.Actions.SignOut size={16} />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function DashboardShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="dark flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 border-r border-primary/15 bg-card/75 lg:block">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile header + drawer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-[70px] items-center justify-between border-b border-primary/15 bg-background/85 px-4 backdrop-blur lg:px-5">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(true)}
              className="lg:hidden"
            >
              <Icons.Layout.Navigation.Menu size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="hidden lg:flex">
              <Icons.Layout.Navigation.Menu size={20} />
            </Button>
            <div className="hidden h-10 w-[min(42vw,520px)] items-center gap-3 rounded-md border border-primary/20 bg-card/50 px-4 text-sm text-muted-foreground md:flex">
              <span>Search anything...</span>
              <Icons.Contact.ExternalLink
                size={16}
                className="ml-auto opacity-60"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Button variant="ghost" size="icon">
                <Icons.Domain.Announcements size={19} />
              </Button>
              <span className="absolute right-1 top-1 rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                12
              </span>
            </div>
            <div className="flex items-center gap-3 border-l border-primary/15 pl-3">
              <Image
                src="/images/gasak-logo.png"
                alt=""
                width={40}
                height={40}
                className="size-10 rounded-full object-cover"
              />
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
              <Badge variant="secondary" className="hidden xl:inline-flex">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
          </div>
        </header>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 border-r border-primary/15 bg-card">
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                >
                  <Icons.Layout.Navigation.Close size={18} />
                </Button>
              </div>
              <SidebarContent user={user} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
}
