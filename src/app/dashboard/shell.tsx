"use client";

import type { Icon } from "@phosphor-icons/react";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { ClipboardText } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import { GameController } from "@phosphor-icons/react/dist/ssr/GameController";
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { List } from "@phosphor-icons/react/dist/ssr/List";
import { Megaphone } from "@phosphor-icons/react/dist/ssr/Megaphone";
import { Package } from "@phosphor-icons/react/dist/ssr/Package";
import { Receipt } from "@phosphor-icons/react/dist/ssr/Receipt";
import { SignOut } from "@phosphor-icons/react/dist/ssr/SignOut";
import { SquaresFour } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { Sword } from "@phosphor-icons/react/dist/ssr/Sword";
import { Trophy } from "@phosphor-icons/react/dist/ssr/Trophy";
import { User } from "@phosphor-icons/react/dist/ssr/User";
import { UsersFour } from "@phosphor-icons/react/dist/ssr/UsersFour";
import { UsersThree } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { X } from "@phosphor-icons/react/dist/ssr/X";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { ROLE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Role } from "@/server/db/schema";

type NavItem = {
  href: string;
  label: string;
  Icon: Icon;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    Icon: SquaresFour,
    roles: ["admin", "leader", "member", "seller"],
  },
  {
    href: "/dashboard/squads",
    label: "Squads",
    Icon: UsersThree,
    roles: ["admin"],
  },
  {
    href: "/dashboard/my-squad",
    label: "My Squad",
    Icon: UsersThree,
    roles: ["leader", "member"],
  },
  {
    href: "/dashboard/players",
    label: "Players",
    Icon: UsersFour,
    roles: ["admin", "leader"],
  },
  {
    href: "/dashboard/recruitment",
    label: "Recruitment",
    Icon: ClipboardText,
    roles: ["admin", "leader"],
  },
  {
    href: "/dashboard/calendar",
    label: "Calendar",
    Icon: CalendarBlank,
    roles: ["admin", "leader", "member"],
  },
  {
    href: "/dashboard/tournaments",
    label: "Tournaments",
    Icon: Trophy,
    roles: ["admin", "leader", "member"],
  },
  {
    href: "/dashboard/scrims",
    label: "Scrims",
    Icon: Sword,
    roles: ["admin", "leader", "member"],
  },
  {
    href: "/dashboard/announcements",
    label: "Announcements",
    Icon: Megaphone,
    roles: ["admin", "leader", "member"],
  },
  {
    href: "/dashboard/products",
    label: "Products",
    Icon: Package,
    roles: ["admin", "seller"],
  },
  {
    href: "/dashboard/orders",
    label: "Orders",
    Icon: Receipt,
    roles: ["admin", "seller"],
  },
  {
    href: "/dashboard/users",
    label: "Users",
    Icon: GameController,
    roles: ["admin"],
  },
  {
    href: "/dashboard/profile",
    label: "My Profile",
    Icon: User,
    roles: ["admin", "leader", "member", "seller"],
  },
];

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

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <Link
        href="/"
        className="flex items-center gap-2 px-2 text-foreground"
        onClick={onNavigate}
      >
        <Lightning weight="fill" size={22} className="text-primary" />
        <span className="text-lg font-black uppercase italic tracking-wide">
          GASAK
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon size={18} weight={active ? "fill" : "regular"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-3 border-t pt-4">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
          <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
        </div>
        <div className="flex items-center gap-2 px-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleSignOut}
          >
            <SignOut size={16} />
            Sign out
          </Button>
          <ThemeToggle />
        </div>
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
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-card p-4 lg:block">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile header + drawer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Lightning weight="fill" size={20} className="text-primary" />
            <span className="font-black uppercase italic tracking-wide">
              GASAK
            </span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <List size={20} />
          </Button>
        </header>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 border-r bg-card p-4">
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                >
                  <X size={18} />
                </Button>
              </div>
              <SidebarContent user={user} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
