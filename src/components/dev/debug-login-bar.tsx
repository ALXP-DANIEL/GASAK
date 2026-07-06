"use client";

import { Icons } from "@components/icons";
import { Button } from "@components/ui/shadcn/button";
import { authClient } from "@lib/auth-client";
import { cn } from "@lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "gasak:debug-login-bar-open";
const DEBUG_LOGIN_REDIRECT = "/dashboard";

const DEBUG_ACCOUNTS = [
  { label: "Admin", email: "admin@gasak.gg", password: "admin123" },
  { label: "Leader", email: "leader@gasak.gg", password: "leader123" },
  { label: "Member", email: "member@gasak.gg", password: "member123" },
  { label: "Seller", email: "seller@gasak.gg", password: "seller123" },
] as const;

export function DebugLoginBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setOpen(stored === "true");
  }, []);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  function isCurrentUrl(url: string) {
    return url === pathname;
  }

  function quickLogin(account: (typeof DEBUG_ACCOUNTS)[number]) {
    startTransition(async () => {
      await authClient.signOut();

      const { data, error } = await authClient.signIn.email({
        email: account.email,
        password: account.password,
        callbackURL: DEBUG_LOGIN_REDIRECT,
      });

      if (error) {
        toast.error(error.message ?? `Could not sign in as ${account.label}`);
        return;
      }

      toast.success(`Signed in as ${account.label}`);
      const nextUrl = data?.url ?? DEBUG_LOGIN_REDIRECT;
      if (isCurrentUrl(nextUrl)) {
        router.refresh();
        return;
      }

      router.push(nextUrl);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Open debug login"
        onClick={toggleOpen}
        className="fixed top-2 right-2 z-50 grid size-8 place-items-center rounded border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icons.Layout.Navigation.CaretRight size={16} className="rotate-180" />
      </button>
    );
  }

  return (
    <div className="fixed top-2 right-2 z-50 flex items-start gap-2">
      <div className="flex max-w-[calc(100vw-4rem)] flex-wrap items-center justify-end gap-1 rounded border border-border bg-background/95 p-2 text-xs text-foreground shadow-sm backdrop-blur">
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
        <Button
          type="button"
          size="xs"
          variant="ghost"
          aria-label="Close debug login"
          className={cn("size-7 p-0", isPending && "pointer-events-none")}
          onClick={toggleOpen}
        >
          <Icons.Layout.Navigation.CaretRight size={14} />
        </Button>
      </div>
    </div>
  );
}
