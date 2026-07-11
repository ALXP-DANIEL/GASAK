"use client";

import { Badge } from "@components/ui/shadcn/badge";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function partsUntil(target: number, now: number): CountdownParts | null {
  const diff = target - now;
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
  };
}

function CountdownDigit({ value, unit }: { value: string; unit: string }) {
  return (
    <div className="grid justify-items-center gap-1">
      <span className="grid h-12 w-14 place-items-center border border-primary/30 bg-background/60 font-heading text-2xl font-bold tabular-nums desktop:h-14 desktop:w-16 desktop:text-3xl">
        {value}
      </span>
      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {unit}
      </span>
    </div>
  );
}

/**
 * Mission-clock hero for the schedules module — a live countdown to the
 * next event. Ticks client-side; renders em-dashes until hydrated so the
 * server and client markup agree.
 */
export function NextEventCountdown({
  href,
  title,
  typeLabel,
  startsAtIso,
  location,
  squadName,
}: {
  href: string;
  title: string;
  typeLabel: string;
  startsAtIso: string;
  location: string | null;
  squadName: string | null;
}) {
  const reduceMotion = useReducedMotion();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const target = new Date(startsAtIso).getTime();
  const parts = now === null ? undefined : partsUntil(target, now);
  const isLive = now !== null && parts === null;

  const pad = (part: keyof CountdownParts) =>
    parts === undefined
      ? "––"
      : String(parts === null ? 0 : parts[part]).padStart(2, "0");

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 0.65, 0.3, 0.9] }}
    >
      <Link
        href={href}
        className="corner-cut hover-lift group relative flex flex-col gap-4 overflow-hidden border border-primary/30 bg-card p-5 desktop:flex-row desktop:items-center desktop:justify-between desktop:p-6"
      >
        <div
          aria-hidden
          className="bg-grid pointer-events-none absolute inset-0 opacity-50"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/10 to-transparent"
        />
        <div className="relative grid min-w-0 gap-1.5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-0.75 -skew-x-12 bg-primary" />
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary">
              {isLive ? "Happening now" : "Next up"}
            </span>
            {isLive && (
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping bg-primary opacity-75" />
                <span className="relative inline-flex size-2 bg-primary" />
              </span>
            )}
          </div>
          <h2 className="truncate font-heading text-2xl font-bold group-hover:text-primary">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{typeLabel}</Badge>
            {squadName && <span>{squadName}</span>}
            {location && <span>· {location}</span>}
          </div>
        </div>

        <div className="relative flex shrink-0 items-center gap-2 desktop:gap-3">
          {isLive ? (
            <span className="text-glow font-heading text-3xl font-bold uppercase text-primary">
              Live
            </span>
          ) : (
            <>
              <CountdownDigit value={pad("days")} unit="days" />
              <CountdownDigit value={pad("hours")} unit="hrs" />
              <CountdownDigit value={pad("minutes")} unit="min" />
              <CountdownDigit value={pad("seconds")} unit="sec" />
            </>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
