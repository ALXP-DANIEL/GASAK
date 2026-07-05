import { cookies } from "next/headers";
import { Separator } from "@/components/ui/shadcn/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/shadcn/sidebar";
import { requireUser, userRole } from "@/lib/session";
import { DashboardBreadcrumbs } from "./_components/dashboard-breadcrumbs";
import { AppSidebar } from "./_components/sidebar/app-sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        user={{
          name: user.name,
          email: user.email,
          role: userRole(user),
          image: user.image,
        }}
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
