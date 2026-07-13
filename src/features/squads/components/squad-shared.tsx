import { CornerCutBorder } from "@components/shared/corner-cut-border";
import { LANE_LABELS, LANE_ORDER, normalizeLanes } from "@lib/labels";
import { cn } from "@lib/utils";
import type { Lane, SquadRole } from "@server/db/schema";
import Image from "next/image";
import type { ReactNode } from "react";

export const roleOrder: Record<SquadRole, number> = {
  leader: 0,
  coach: 1,
  player: 2,
  reserve: 3,
};

type RosterMember = {
  squadRole: SquadRole;
  user: { profile?: { preferredLanes: Lane[] | null } | null };
};

export function sortRoster<T extends { squadRole: SquadRole }>(members: T[]) {
  return [...members].sort(
    (a, b) => roleOrder[a.squadRole] - roleOrder[b.squadRole],
  );
}

export function rosterBreakdown<T extends RosterMember>(members: T[]) {
  const filledLanes = new Set<Lane>();
  for (const member of members) {
    for (const lane of normalizeLanes(member.user.profile?.preferredLanes)) {
      if (lane !== "flex") filledLanes.add(lane);
    }
  }
  return {
    leaders: members.filter((m) => ["leader", "coach"].includes(m.squadRole)),
    players: members.filter((m) => m.squadRole === "player"),
    reserves: members.filter((m) => m.squadRole === "reserve"),
    filledLanes: filledLanes.size,
  };
}

export function SquadLogo({
  src,
  name,
  className,
}: {
  src: string | null;
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-none border bg-background",
        className,
      )}
    >
      <Image
        src={src ?? "/images/gasak-logo.png"}
        alt={`${name} logo`}
        width={128}
        height={128}
        className="size-full object-cover"
      />
    </div>
  );
}

export function HeroMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-primary/20 bg-background/70 p-3">
      <p className="font-heading text-2xl font-bold text-primary">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

type SquadHeroHeaderSquad = {
  name: string;
  description: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
};

/**
 * The banner-and-metrics hero header shared by the public squad page and the
 * dashboard squad detail page — bg-grid texture, corner glow, logo, title,
 * and a metrics column. `badge` and `metrics` are the only per-page inputs.
 */
export function SquadHeroHeader({
  squad,
  badge,
  metrics,
  size = "md",
}: {
  squad: SquadHeroHeaderSquad;
  badge: ReactNode;
  metrics: { label: string; value: number }[];
  /** `lg` is used on the public page; `md` on the denser dashboard page. */
  size?: "md" | "lg";
}) {
  const isLg = size === "lg";

  return (
    <section className="relative isolate overflow-hidden rounded-lg border border-primary/25 bg-card">
      {squad.bannerUrl && (
        <Image
          src={squad.bannerUrl}
          alt={`${squad.name} banner`}
          fill
          priority
          className={cn("object-cover", isLg ? "opacity-25" : "opacity-20")}
        />
      )}
      <div className="absolute inset-0 bg-linear-to-r from-background via-background/90 to-background/35" />
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/20 blur-3xl"
      />

      <div
        className={cn(
          "relative grid desktop:grid-cols-[1fr_auto]",
          isLg ? "gap-8 p-6 desktop:p-10" : "gap-6 p-5 desktop:p-8",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-col desktop:flex-row desktop:items-end",
            isLg ? "gap-6" : "gap-5",
          )}
        >
          <SquadLogo
            src={squad.logoUrl}
            name={squad.name}
            className={
              isLg ? "size-24 desktop:size-32" : "size-24 desktop:size-28"
            }
          />
          <div className="min-w-0">
            {badge}
            <h1
              className={cn(
                "mt-4 text-balance font-heading font-bold uppercase leading-tight tracking-wide",
                isLg
                  ? "text-4xl desktop:text-6xl"
                  : "text-4xl desktop:text-5xl",
              )}
            >
              {squad.name}
            </h1>
            {squad.description && (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground desktop:text-base">
                {squad.description}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 desktop:w-56">
          {metrics.map((metric) => (
            <HeroMetric key={metric.label} {...metric} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function SquadStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative flex items-center gap-3 overflow-hidden border bg-card p-4 shadow-xs transition-colors hover:bg-muted/40">
      <span
        aria-hidden
        className="absolute top-0 left-0 h-0.5 w-8 -skew-x-12 bg-primary/0 transition-colors group-hover:bg-primary"
      />
      <CornerCutBorder
        borderClassName="bg-primary/40"
        className="size-9 shrink-0"
        contentClassName="grid size-full place-items-center bg-primary/10 text-primary"
      >
        {icon}
      </CornerCutBorder>
      <div className="min-w-0">
        <p className="font-heading text-2xl font-bold leading-none tabular-nums">
          {value}
        </p>
        <p className="mt-1 truncate text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

export function LaneSpread<T extends RosterMember>({
  members,
}: {
  members: T[];
}) {
  return (
    <div className="grid gap-2">
      {LANE_ORDER.filter((lane) => lane !== "flex").map((lane) => {
        const count = members.filter((member) =>
          normalizeLanes(member.user.profile?.preferredLanes).includes(lane),
        ).length;
        return (
          <div
            key={lane}
            className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-b-0"
          >
            <span className="text-muted-foreground">{LANE_LABELS[lane]}</span>
            <span className="font-medium">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
