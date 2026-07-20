import { DebugLoginBar } from "@components/dev/debug-login-bar";
import { Separator } from "@components/ui/shadcn/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@components/ui/shadcn/sidebar";
import { Skeleton } from "@components/ui/shadcn/skeleton";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { env } from "@/env";
import { CommandPalette } from "./_components/command-palette";
import { DashboardBreadcrumbs } from "./_components/dashboard-breadcrumbs";
import { getDashboardContext } from "./_components/dashboard-context";
import { PersonalEmailPrompt } from "./_components/personal-email-prompt";
import { AppSidebar } from "./_components/sidebar/app-sidebar";

const showDebugLogin = env.NODE_ENV !== "production";

/**
 * The shell reads session + sidebar cookies, so it must live below a
 * Suspense boundary under cacheComponents; the fallback sketches the
 * sidebar rail and header so first paint isn't a blank screen.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh w-full">
      <div className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-4 desktop:flex">
        <Skeleton className="h-8 w-36" />
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
              key={index}
              className="h-8 w-full"
            />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center gap-3 border-b px-4 desktop:px-6">
          <Skeleton className="size-7" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="p-4 desktop:p-6">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-4 h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

async function DashboardShell({ children }: { children: React.ReactNode }) {
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
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md">
          <div className="flex w-full items-center gap-1 px-4 desktop:gap-2 desktop:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
            />
            <DashboardBreadcrumbs />
            <CommandPalette access={access} />
          </div>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 mobile:pb-[calc(env(safe-area-inset-bottom)+1rem)] desktop:p-6">
          <div className="mx-auto w-full max-w-384">
            {user.personalEmail ? null : <PersonalEmailPrompt />}
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
