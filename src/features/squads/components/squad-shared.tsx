import { LANE_LABELS, LANE_ORDER, normalizeLanes } from "@lib/labels";
import { cn } from "@lib/utils";
import type { Lane, SquadRole } from "@server/db/schema";
import Image from "next/image";

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
        unoptimized={Boolean(src)}
      />
    </div>
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
      <span className="corner-cut grid size-9 shrink-0 place-items-center border border-primary/40 bg-primary/10 text-primary">
        {icon}
      </span>
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
      {LANE_ORDER.map((lane) => {
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
