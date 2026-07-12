import { SiteFooter } from "@components/layout/site-footer";
import { AuthLink, SiteHeader } from "@components/layout/site-header";
import { Suspense } from "react";
import { SessionAuthLink } from "./_components/session-auth-link";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader
        authSlot={
          <Suspense fallback={<AuthLink isLoggedIn={false} />}>
            <SessionAuthLink />
          </Suspense>
        }
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
