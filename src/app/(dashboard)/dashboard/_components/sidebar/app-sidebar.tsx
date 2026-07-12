"use client";

import { Logo } from "@components/layout/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@components/ui/shadcn/sidebar";
import {
  canAccessDashboardItem,
  type DashboardAccess,
  dashboardSidebarGroups,
} from "@config/dashboard";
import type { SquadRole } from "@server/db";
import { NavMain } from "./nav-main";
import { NavUser, type SidebarUser } from "./nav-user";
import { canToggleFocus, resolveDashboardAccess } from "./sidebar-focus";
import { SidebarFocusToggle, useSidebarFocus } from "./sidebar-focus-toggle";

export function AppSidebar({
  user,
  access,
  primarySquadRole,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: SidebarUser;
  access: DashboardAccess;
  primarySquadRole: SquadRole | null;
}) {
  const [focus, setFocus] = useSidebarFocus();
  const effectiveAccess = resolveDashboardAccess(access, focus);

  const groups = dashboardSidebarGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canAccessDashboardItem(item, effectiveAccess),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-auto"
              render={
                <Logo
                  href="/"
                  size={24}
                  wordmark="full"
                  wordmarkClassName="group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0"
                />
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
        {canToggleFocus(access) && primarySquadRole && (
          <SidebarFocusToggle
            focus={focus}
            onChange={setFocus}
            orgRole={access.orgRole}
            squadRole={primarySquadRole}
          />
        )}
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
