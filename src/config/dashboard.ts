import { Icons } from "@components/icons";
import type { Icon } from "@phosphor-icons/react";
import type { OrgRole } from "@server/db/schema";

/** Capability snapshot used to decide what a user can see in the dashboard. */
export type DashboardAccess = {
  orgRole: OrgRole;
  hasSquad: boolean;
  managesSquad: boolean;
};

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: Icon;
  canAccess: (access: DashboardAccess) => boolean;
};

export type DashboardNavGroup = {
  id: string;
  label?: string;
  items: DashboardNavItem[];
};

const everyone = () => true;
const isAdmin = (a: DashboardAccess) => a.orgRole === "admin";
const canUseCommerce = (a: DashboardAccess) =>
  a.orgRole === "admin" || a.orgRole === "seller";
const canViewSquadArea = (a: DashboardAccess) =>
  a.orgRole === "admin" || a.hasSquad;
const canManageSquadArea = (a: DashboardAccess) =>
  a.orgRole === "admin" || a.managesSquad;
const canViewReports = (a: DashboardAccess) =>
  canUseCommerce(a) || a.managesSquad;

export const dashboardSidebarGroups: DashboardNavGroup[] = [
  {
    id: "overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: Icons.Layout.Navigation.Home,
        canAccess: everyone,
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
        canAccess: canViewSquadArea,
      },
      {
        href: "/dashboard/squads",
        label: "Squads",
        icon: Icons.Stats.Squads,
        canAccess: isAdmin,
      },
      {
        href: "/dashboard/players",
        label: "Players",
        icon: Icons.Domain.Players,
        canAccess: isAdmin,
      },
      {
        href: "/dashboard/matches",
        label: "Matches",
        icon: Icons.Domain.Scrims,
        canAccess: canViewSquadArea,
      },
      {
        href: "/dashboard/schedules",
        label: "Schedules",
        icon: Icons.Domain.Calendar,
        canAccess: canViewSquadArea,
      },
      {
        href: "/dashboard/announcements",
        label: "Announcements",
        icon: Icons.Domain.Announcements,
        canAccess: canViewSquadArea,
      },
      {
        href: "/dashboard/my-squad",
        label: "My Squad",
        icon: Icons.Domain.Members,
        canAccess: (a) => a.hasSquad,
      },
      {
        href: "/dashboard/recruitment",
        label: "Recruitment",
        icon: Icons.Domain.Recruitment,
        canAccess: canManageSquadArea,
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
        canAccess: canUseCommerce,
      },
      {
        href: "/dashboard/products",
        label: "Products",
        icon: Icons.Domain.Products,
        canAccess: canUseCommerce,
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
        canAccess: isAdmin,
      },
      {
        href: "/dashboard/auth-slides",
        label: "Auth Slides",
        icon: Icons.Domain.News,
        canAccess: isAdmin,
      },
      {
        href: "/dashboard/logs",
        label: "Logs",
        icon: Icons.Domain.Reports,
        canAccess: isAdmin,
      },
      {
        href: "/dashboard/reports",
        label: "Reports",
        icon: Icons.Domain.Reports,
        canAccess: canViewReports,
      },
      {
        href: "/dashboard/settings",
        label: "Settings",
        icon: Icons.Actions.Settings,
        canAccess: everyone,
      },
    ],
  },
];

export const dashboardNavigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/tournaments", label: "Tournaments" },
  { href: "/dashboard/squads", label: "Squads" },
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

export function canAccessDashboardItem(
  item: DashboardNavItem,
  access: DashboardAccess,
) {
  return item.canAccess(access);
}
