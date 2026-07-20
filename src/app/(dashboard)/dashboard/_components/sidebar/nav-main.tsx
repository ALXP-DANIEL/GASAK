"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
              {group.items.map((item) => {
                const activeChild = item.children?.find((child) =>
                  isActive(child.href),
                );
                const itemActive = isActive(item.href) && !activeChild;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={itemActive}
                      className="rounded-none border-l-2 border-transparent data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                      render={
                        <Link href={item.href} onClick={handleNavigate}>
                          <item.icon weight={itemActive ? "fill" : "regular"} />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                    {item.children && item.children.length > 0 && (
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton
                              isActive={isActive(child.href)}
                              className="rounded-none border-l-2 border-transparent data-active:border-primary data-active:bg-primary/10 data-active:text-primary"
                              render={
                                <Link
                                  href={child.href}
                                  onClick={handleNavigate}
                                >
                                  <child.icon
                                    weight={
                                      isActive(child.href) ? "fill" : "regular"
                                    }
                                  />
                                  <span>{child.label}</span>
                                </Link>
                              }
                            />
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
