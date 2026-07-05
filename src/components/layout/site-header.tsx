"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Squads", href: "/squads" },
  { label: "Players", href: "/players" },
  { label: "Recruitment", href: "/recruitment" },
  { label: "Shop", href: "/shop" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/images/gasak-logo.png"
        alt="GASAK ESPORT logo"
        width={40}
        height={40}
        className="size-10 rounded-full object-cover"
      />
      <span className="flex flex-col leading-none">
        <span className="font-heading text-lg font-bold uppercase tracking-widest text-primary">
          Gasak
        </span>
        <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          Esport
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
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
    <header className="sticky top-0 z-50 border-b border-primary/20 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
        <Brand />

        <nav
          className="hidden items-center gap-5 lg:flex"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map(({ label, href }) => (
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

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="rounded border border-primary/50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="rounded bg-primary px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
          >
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Link
            href="/login"
            className="rounded border border-primary/50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
          >
            Login
          </Link>
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

      {open && (
        <nav
          className="border-t border-primary/20 bg-background px-4 py-4 lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map(({ label, href }) => (
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
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="mt-2 rounded bg-primary px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-primary-foreground"
            >
              Dashboard
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
