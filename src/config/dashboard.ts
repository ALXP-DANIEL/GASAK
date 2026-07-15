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
    id: "squad",
    label: "Squad",
    items: [
      {
        href: "/dashboard/my-squad",
        label: "My Squad",
        icon: Icons.Domain.Members,
        canAccess: (a) => a.hasSquad,
      },
      {
        href: "/dashboard/schedules",
        label: "Schedules",
        icon: Icons.Domain.Calendar,
        canAccess: canViewSquadArea,
      },
      {
        href: "/dashboard/matches",
        label: "Matches",
        icon: Icons.Domain.Scrims,
        canAccess: canViewSquadArea,
      },
      {
        href: "/dashboard/tournaments",
        label: "Tournaments",
        icon: Icons.Stats.Trophies,
        canAccess: canViewSquadArea,
      },
      {
        href: "/dashboard/news",
        label: "News",
        icon: Icons.Domain.News,
        canAccess: canViewSquadArea,
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
    id: "management",
    label: "Management",
    items: [
      {
        href: "/dashboard/squads",
        label: "Squads",
        icon: Icons.Domain.Squads,
        canAccess: isAdmin,
      },
      {
        href: "/dashboard/players",
        label: "Players",
        icon: Icons.Stats.Players,
        canAccess: isAdmin,
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
      {
        href: "/dashboard/joki",
        label: "Joki",
        icon: Icons.Domain.Joki,
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
        icon: Icons.Domain.Accounts,
        canAccess: isAdmin,
      },
      {
        href: "/dashboard/auth-slides",
        label: "Auth Slides",
        icon: Icons.Editor.Image,
        canAccess: isAdmin,
      },
      {
        href: "/dashboard/organization",
        label: "Organization",
        icon: Icons.Domain.Hierarchy,
        canAccess: isAdmin,
      },
      {
        href: "/dashboard/logs",
        label: "Logs",
        icon: Icons.Domain.Audit,
        canAccess: isAdmin,
      },
      {
        href: "/dashboard/reports",
        label: "Reports",
        icon: Icons.Domain.Reports,
        canAccess: canViewReports,
      },
    ],
  },
];

export function canAccessDashboardItem(
  item: DashboardNavItem,
  access: DashboardAccess,
) {
  return item.canAccess(access);
}
