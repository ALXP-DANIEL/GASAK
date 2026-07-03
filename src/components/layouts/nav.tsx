"use client";

import type { Icon } from "@phosphor-icons/react";
import { DotsThreeOutline } from "@phosphor-icons/react/dist/ssr/DotsThreeOutline";
import { House } from "@phosphor-icons/react/dist/ssr/House";
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { Storefront } from "@phosphor-icons/react/dist/ssr/Storefront";
import { UsersThree } from "@phosphor-icons/react/dist/ssr/UsersThree";
import * as motion from "motion/react-client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../ui/theme-toggle";

const ITEMS: { id: string; href: string; label: string; Icon: Icon }[] = [
  { id: "home", href: "/", label: "Home", Icon: House },
  { id: "squads", href: "/squads", label: "Squads", Icon: UsersThree },
  { id: "shop", href: "/shop", label: "Shop", Icon: Storefront },
  { id: "more", href: "/more", label: "More", Icon: DotsThreeOutline },
];

const SPRING = { type: "spring", stiffness: 400, damping: 28 } as const;

function NavLinks({ layoutScope }: { layoutScope: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef({ active: false, moved: false, lastX: 0 });

  const activeIndex = ITEMS.findIndex(({ href }) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href),
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pressed, setPressed] = useState(false);

  const visibleIndex = dragIndex ?? activeIndex;

  // Hold the pill at the drag position until the new route lands
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname intentionally triggers the reset
  useEffect(() => {
    setDragIndex(null);
  }, [pathname]);

  const getHoveredIndex = useCallback(
    (clientX: number) => {
      const rect = navRef.current?.getBoundingClientRect();
      if (!rect) return activeIndex;
      const cell = rect.width / ITEMS.length;
      return Math.max(
        0,
        Math.min(ITEMS.length - 1, Math.floor((clientX - rect.left) / cell)),
      );
    },
    [activeIndex],
  );

  function release(event: React.PointerEvent) {
    indicatorRef.current.active = false;
    setPressed(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <motion.nav
      ref={navRef}
      className="glass relative z-20 flex items-center justify-between gap-1 rounded-full p-1.5 text-foreground lg:justify-start lg:gap-0.5 lg:p-1 lg:shadow-none"
    >
      {ITEMS.map(({ id, href, label, Icon }, index) => {
        const isActive = index === visibleIndex;

        return (
          <Link
            key={id}
            href={href}
            draggable={false}
            className={cn(
              "relative flex flex-1 select-none items-center justify-center gap-1.5 rounded-full px-2 py-2 transition-colors duration-500 ease-out lg:flex-initial lg:px-3 lg:py-1.5",
              isActive ? "text-foreground" : "text-muted-foreground",
            )}
            onClick={(e) => {
              if (indicatorRef.current.moved) {
                e.preventDefault();
                indicatorRef.current.moved = false;
              }
            }}
            onPointerDown={(event) => {
              if (index !== activeIndex) return;
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              indicatorRef.current.active = true;
              indicatorRef.current.moved = false;
              indicatorRef.current.lastX = event.clientX;
              setPressed(true);
            }}
            onPointerMove={(event) => {
              const ind = indicatorRef.current;
              if (
                !ind.active ||
                !event.currentTarget.hasPointerCapture(event.pointerId)
              )
                return;
              if (Math.abs(event.clientX - ind.lastX) > 2) ind.moved = true;
              ind.lastX = event.clientX;
              setDragIndex(getHoveredIndex(event.clientX));
            }}
            onPointerUp={(event) => {
              if (!indicatorRef.current.active) return;
              release(event);
              if (dragIndex !== null && dragIndex !== activeIndex) {
                router.push(ITEMS[dragIndex].href);
              } else {
                setDragIndex(null);
              }
            }}
            onPointerCancel={(event) => {
              indicatorRef.current.moved = false;
              release(event);
              setDragIndex(null);
            }}
          >
            {isActive && (
              <motion.span
                layoutId={`${layoutScope}-active`}
                className="absolute inset-0 rounded-full"
                style={{ background: "var(--glass-active)" }}
                animate={{ scale: pressed ? 1.18 : 1 }}
                transition={SPRING}
              />
            )}
            <Icon
              size={18}
              weight={isActive ? "fill" : "regular"}
              className="relative z-10 lg:size-4"
            />
            <span
              className="relative z-10 overflow-hidden whitespace-nowrap text-[12px] font-semibold lg:text-[11px]"
              style={{
                maxWidth: isActive ? 80 : 0,
                opacity: isActive ? 1 : 0,
                transition: "max-width 0.32s ease, opacity 0.25s ease",
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </motion.nav>
  );
}

export function Nav() {
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
        <ThemeToggle />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <NavLinks layoutScope="mobile-nav" />
      </div>

      <div className="fixed inset-x-0 top-0 z-50 hidden items-center justify-between px-8 py-4 lg:flex xl:px-12">
        <Link
          href="/"
          className="glass flex items-center gap-2.5 rounded-full px-3.5 py-2 text-foreground"
        >
          <Lightning weight="fill" size={20} className="text-primary" />
          <span className="text-base font-black uppercase italic tracking-wide">
            GASAK
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <NavLinks layoutScope="desktop-nav" />
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}
