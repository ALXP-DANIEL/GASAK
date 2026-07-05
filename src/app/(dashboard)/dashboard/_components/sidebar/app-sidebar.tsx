"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/shadcn/sidebar";
import {
  canAccessDashboardItem,
  dashboardSidebarGroups,
} from "@/config/dashboard";
import { NavMain } from "./nav-main";
import { NavUser, type SidebarUser } from "./nav-user";

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: SidebarUser }) {
  const groups = dashboardSidebarGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canAccessDashboardItem(item, user.role),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard">
                <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Icons.Domain.Lightning size={14} weight="fill" />
                </div>
                <span className="font-heading text-base font-semibold">
                  GASAK
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
