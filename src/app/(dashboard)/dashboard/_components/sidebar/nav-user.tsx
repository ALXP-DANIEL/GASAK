"use client";

import { Icons } from "@components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/shadcn/avatar";
import { Badge } from "@components/ui/shadcn/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/shadcn/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@components/ui/shadcn/sidebar";
import { authClient } from "@lib/auth-client";
import { initials } from "@lib/format";
import { ORG_ROLE_LABELS } from "@lib/labels";
import type { OrgRole } from "@server/db/schema";
import { useRouter } from "next/navigation";

export type SidebarUser = {
  name: string;
  email: string;
  role: OrgRole;
  image?: string | null;
};

export function NavUser({ user }: { user: SidebarUser }) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <Icons.Actions.CaretUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {ORG_ROLE_LABELS[user.role]}
                  </Badge>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <a href="/dashboard/profile">
                  <Icons.Stats.Players />
                  Profile
                </a>
              }
            />
            <DropdownMenuItem
              render={
                <a href="/dashboard/settings">
                  <Icons.Actions.Settings />
                  Settings
                </a>
              }
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>
              <Icons.Actions.SignOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
