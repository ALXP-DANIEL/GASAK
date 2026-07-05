"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import { authClient } from "@/lib/auth-client";

const DEBUG_ACCOUNTS = [
  { label: "Admin", email: "admin@gasak.gg", password: "admin123" },
  { label: "Leader", email: "leader@gasak.gg", password: "leader123" },
  { label: "Member", email: "member@gasak.gg", password: "member123" },
  { label: "Seller", email: "seller@gasak.gg", password: "seller123" },
] as const;

export function DebugLoginBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function currentCallbackUrl() {
    const callbackUrl =
      searchParams.get("callbackUrl") ??
      searchParams.get("callbackURL") ??
      searchParams.get("next");
    if (callbackUrl) return callbackUrl;
    if (
      pathname === "/login" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password"
    ) {
      return "/dashboard";
    }

    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function quickLogin(account: (typeof DEBUG_ACCOUNTS)[number]) {
    startTransition(async () => {
      const callbackURL = currentCallbackUrl() || "/dashboard";
      await authClient.signOut();

      const { data, error } = await authClient.signIn.email({
        email: account.email,
        password: account.password,
        callbackURL,
      });

      if (error) {
        toast.error(error.message ?? `Could not sign in as ${account.label}`);
        return;
      }

      toast.success(`Signed in as ${account.label}`);
      router.push(data?.url ?? callbackURL);
      router.refresh();
    });
  }

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-background/95 px-3 py-2 text-foreground backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-muted-foreground">Debug login</span>
        <div className="flex flex-wrap gap-1">
          {DEBUG_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              type="button"
              size="xs"
              variant="outline"
              disabled={isPending}
              onClick={() => quickLogin(account)}
            >
              {account.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
