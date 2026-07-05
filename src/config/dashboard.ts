import type { Icon } from "@phosphor-icons/react";
import { Icons } from "@/components/icons";
import type { Role } from "@/server/db/schema";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: Icon;
  roles: readonly Role[];
};

export type DashboardNavGroup = {
  id: string;
  label?: string;
  items: DashboardNavItem[];
};

export const dashboardRoleGroups = {
  all: ["admin", "leader", "member", "seller"],
  squad: ["admin", "leader", "member", "seller"],
  squadManagers: ["admin", "leader"],
  commerce: ["admin", "seller"],
  admin: ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export const dashboardSidebarGroups: DashboardNavGroup[] = [
  {
    id: "overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: Icons.Layout.Navigation.Home,
        roles: dashboardRoleGroups.all,
      },
    ],
  },
  {
    id: "competition",
    label: "Competition",
    items: [
      {
        href: "/dashboard/tournaments",
        label: "Tournaments",
        icon: Icons.Stats.Trophies,
        roles: dashboardRoleGroups.squad,
      },
      {
        href: "/dashboard/teams",
        label: "Squads",
        icon: Icons.Stats.Squads,
        roles: dashboardRoleGroups.squad,
      },
      {
        href: "/dashboard/players",
        label: "Players",
        icon: Icons.Domain.Players,
        roles: dashboardRoleGroups.squadManagers,
      },
      {
        href: "/dashboard/matches",
        label: "Matches",
        icon: Icons.Domain.Scrims,
        roles: dashboardRoleGroups.squad,
      },
      {
        href: "/dashboard/schedules",
        label: "Schedules",
        icon: Icons.Domain.Calendar,
        roles: dashboardRoleGroups.squad,
      },
      {
        href: "/dashboard/announcements",
        label: "Announcements",
        icon: Icons.Domain.Announcements,
        roles: dashboardRoleGroups.squad,
      },
      {
        href: "/dashboard/my-squad",
        label: "My Squad",
        icon: Icons.Domain.Members,
        roles: dashboardRoleGroups.squad,
      },
      {
        href: "/dashboard/recruitment",
        label: "Recruitment",
        icon: Icons.Domain.Recruitment,
        roles: dashboardRoleGroups.squadManagers,
      },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    items: [
      {
        href: "/dashboard/orders",
        label: "Orders",
        icon: Icons.Domain.Orders,
        roles: dashboardRoleGroups.commerce,
      },
      {
        href: "/dashboard/products",
        label: "Products",
        icon: Icons.Domain.Products,
        roles: dashboardRoleGroups.commerce,
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        href: "/dashboard/users",
        label: "Users",
        icon: Icons.Domain.Members,
        roles: dashboardRoleGroups.admin,
      },
      {
        href: "/dashboard/reports",
        label: "Reports",
        icon: Icons.Domain.Reports,
        roles: dashboardRoleGroups.all,
      },
      {
        href: "/dashboard/settings",
        label: "Settings",
        icon: Icons.Actions.Settings,
        roles: dashboardRoleGroups.all,
      },
    ],
  },
];

export const dashboardNavigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/tournaments", label: "Tournaments" },
  { href: "/dashboard/teams", label: "Squads" },
  { href: "/dashboard/players", label: "Players" },
  { href: "/dashboard/matches", label: "Matches" },
  { href: "/dashboard/schedules", label: "Schedules" },
  { href: "/dashboard/announcements", label: "Announcements" },
  { href: "/dashboard/my-squad", label: "My Squad" },
  { href: "/dashboard/recruitment", label: "Recruitment" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/users", label: "Users" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

export const dashboardRouteAccess = Object.fromEntries(
  dashboardSidebarGroups.flatMap((group) =>
    group.items.map((item) => [item.href, item.roles]),
  ),
) as Record<string, readonly Role[]>;

export function canAccessDashboardItem(item: DashboardNavItem, role: Role) {
  return item.roles.includes(role);
}
