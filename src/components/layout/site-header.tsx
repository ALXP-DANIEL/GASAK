"use client";

import { Icons } from "@components/icons";
import { publicNavigation } from "@config/navigation";
import { cn } from "@lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./logo";

function AuthLink({
  isLoggedIn,
  className,
  onClick,
}: {
  isLoggedIn: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return isLoggedIn ? (
    <Link
      href="/dashboard"
      onClick={onClick}
      className={cn(
        "rounded bg-primary px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90",
        className,
      )}
    >
      Dashboard
    </Link>
  ) : (
    <Link
      href="/login"
      onClick={onClick}
      className={cn(
        "rounded border border-primary/50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10",
        className,
      )}
    >
      Login
    </Link>
  );
}

export function SiteHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on navigation
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname change is the close signal
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-linear-to-b from-background/95 via-background/80 to-transparent backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 desktop:px-8">
        <Logo size={40} wordmark="full" />

        <nav
          className="hidden items-center gap-5 desktop:flex"
          aria-label="Main navigation"
        >
          {publicNavigation.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "border-b-2 pb-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                isActive(href)
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground/80 hover:text-primary",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 desktop:flex">
          <AuthLink isLoggedIn={isLoggedIn} />
        </div>

        <div className="flex items-center gap-3 desktop:hidden">
          <AuthLink isLoggedIn={isLoggedIn} />
          <button
            type="button"
            className="text-primary"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? (
              <Icons.Layout.Navigation.Close size={24} />
            ) : (
              <Icons.Layout.Navigation.Menu size={24} />
            )}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "absolute inset-x-0 top-full grid bg-background opacity-0 shadow-lg transition-[grid-template-rows,opacity] duration-300 ease-in-out desktop:hidden",
          open
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0",
        )}
        inert={!open}
      >
        <nav
          className="overflow-hidden border-t border-primary/20 px-4 py-4"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-3">
            {publicNavigation.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "text-sm font-semibold uppercase tracking-wider",
                  isActive(href) ? "text-primary" : "text-foreground/80",
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
