import { DebugLoginBar } from "@components/dev/debug-login-bar";
import { Separator } from "@components/ui/shadcn/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@components/ui/shadcn/sidebar";
import { cookies } from "next/headers";
import { env } from "@/env";
import { DashboardBreadcrumbs } from "./_components/dashboard-breadcrumbs";
import { getDashboardContext } from "./_components/dashboard-context";
import { AppSidebar } from "./_components/sidebar/app-sidebar";

export const dynamic = "force-dynamic";

const showDebugLogin = env.NODE_ENV !== "production";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ user, access, primarySquadRole }, cookieStore] = await Promise.all([
    getDashboardContext(),
    cookies(),
  ]);
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {showDebugLogin ? <DebugLoginBar /> : null}
      <AppSidebar
        user={{
          name: user.name,
          email: user.email,
          role: access.orgRole,
          image: user.image,
        }}
        access={access}
        primarySquadRole={primarySquadRole}
      />
      <SidebarInset className="min-w-0 overflow-x-clip">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b">
          <div className="flex w-full items-center gap-1 px-4 desktop:gap-2 desktop:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
            />
            <DashboardBreadcrumbs />
          </div>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 desktop:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
