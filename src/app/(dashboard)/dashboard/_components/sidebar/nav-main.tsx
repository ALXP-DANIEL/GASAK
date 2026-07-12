"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@components/ui/shadcn/sidebar";
import type { DashboardNavGroup } from "@config/dashboard";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({ groups }: { groups: DashboardNavGroup[] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label && (
            <SidebarGroupLabel className="gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] group-data-[collapsible=icon]:pointer-events-none">
              <span
                aria-hidden
                className="h-2 w-0.5 -skew-x-12 bg-primary/60"
              />
              {group.label}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={isActive(item.href)}
                    className="rounded-none border-l-2 border-transparent data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                    render={
                      <Link href={item.href} onClick={handleNavigate}>
                        <item.icon
                          weight={isActive(item.href) ? "fill" : "regular"}
                        />
                        <span>{item.label}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
