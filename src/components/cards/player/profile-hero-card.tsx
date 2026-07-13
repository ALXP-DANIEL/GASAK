import { Icons } from "@components/icons";
import { CornerCutBorder } from "@components/shared/corner-cut-border";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/shadcn/avatar";
import { Badge } from "@components/ui/shadcn/badge";
import { initials } from "@lib/format";
import { formatLanes, formatMlbbId, SQUAD_ROLE_LABELS } from "@lib/labels";
import { formatRank, type MlbbRank } from "@lib/ranks";
import { cn } from "@lib/utils";
import type { Icon } from "@phosphor-icons/react";
import type { Lane, SquadRole } from "@server/db/schema";

type PlayerProfile = {
  fullName?: string | null;
  nickname?: string | null;
  ign?: string | null;
  mlbbId?: string | null;
  serverId?: string | null;
  phone?: string | null;
  preferredLanes?: Lane[] | null;
  currentRank?: MlbbRank | null;
  peakRank?: MlbbRank | null;
};

export type ProfileHeroCardProps = {
  name: string;
  image?: string | null;
  profile?: PlayerProfile | null;
  squadRole?: SquadRole;
  /** Scaled-down layout for roster grids and other dense listings. */
  compact?: boolean;
  className?: string;
};

/**
 * The single player card used across the app — corner-cut jersey silhouette,
 * glowing avatar ring, and a stat readout strip built from the shared HUD
 * primitives. Used full-size on detail/profile pages, and with `compact` for
 * roster grids (dashboard squads, my-squad, public squad rosters).
 */
export function ProfileHeroCard({
  name,
  image,
  profile,
  squadRole,
  compact = false,
  className,
}: ProfileHeroCardProps) {
  const displayName = profile?.ign || profile?.nickname || name;
  const lane = formatLanes(profile?.preferredLanes);
  const currentRank = formatRank(profile?.currentRank);
  const peakRank = formatRank(profile?.peakRank);

  return (
    <CornerCutBorder
      borderClassName="bg-primary/30"
      className={className}
      contentClassName="relative isolate overflow-hidden bg-card shadow-glow"
    >
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 opacity-50"
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-24 -right-24 rounded-full bg-primary/20 blur-3xl",
          compact ? "size-40" : "size-64",
        )}
      />

      <div
        className={cn(
          "relative flex flex-col",
          compact ? "gap-4 p-4" : "gap-6 p-6 desktop:p-8",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          {!compact && (
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-3.5 w-1 shrink-0 -skew-x-12 bg-primary"
              />
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary">
                Player Card
              </span>
            </div>
          )}
          {squadRole && (
            <Badge
              variant={squadRole === "leader" ? "default" : "outline"}
              className={cn(compact && "ml-auto")}
            >
              {SQUAD_ROLE_LABELS[squadRole]}
            </Badge>
          )}
        </div>

        <div
          className={cn(
            "flex flex-col items-center text-center",
            compact
              ? "gap-3 desktop:flex-row desktop:items-center desktop:text-left"
              : "gap-4 desktop:flex-row desktop:items-center desktop:text-left",
          )}
        >
          <div className="relative shrink-0">
            <div
              aria-hidden
              className="absolute inset-0 -m-1.5 rounded-full bg-primary/30 blur-md"
            />
            <Avatar
              className={cn(
                "relative border-2 border-primary/50 shadow-glow",
                compact ? "size-14" : "size-24",
              )}
            >
              <AvatarImage src={image ?? undefined} alt={displayName} />
              <AvatarFallback
                className={cn(
                  "bg-primary/10 font-heading font-bold text-primary",
                  compact ? "text-base" : "text-2xl",
                )}
              >
                {initials(displayName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="grid min-w-0 gap-1.5">
            <h2
              className={cn(
                "font-heading font-bold uppercase leading-none tracking-normal text-glow",
                compact ? "text-lg" : "text-3xl desktop:text-4xl",
              )}
            >
              {displayName}
            </h2>
            {!compact && (
              <p className="truncate text-sm text-muted-foreground">{name}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 overflow-hidden border border-border/70 bg-background/40">
          <HeroStat
            icon={Icons.Domain.Scrims}
            label="Lane"
            value={lane || "-"}
            compact={compact}
          />
          <HeroStat
            icon={Icons.Stats.Trophies}
            label="Current"
            value={currentRank}
            compact={compact}
          />
          <HeroStat
            icon={Icons.Stats.Trophies}
            label="Peak"
            value={peakRank}
            compact={compact}
          />
          <HeroStat
            icon={Icons.Domain.Players}
            label="MLBB ID"
            value={formatMlbbId(profile?.mlbbId, profile?.serverId)}
            compact={compact}
          />
        </div>
      </div>
    </CornerCutBorder>
  );
}

function HeroStat({
  icon: StatIcon,
  label,
  value,
  compact,
}: {
  icon: Icon;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "-mt-px -ml-px flex flex-col border-t border-l border-border/70",
        compact ? "gap-0.5 px-2.5 py-2" : "gap-1 px-3.5 py-3",
      )}
    >
      <span className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <StatIcon
          className="size-3.5 shrink-0 text-primary/70"
          weight="duotone"
        />
        {label}
      </span>
      <span
        className={cn(
          "truncate font-heading font-bold tracking-normal",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {value}
      </span>
    </div>
  );
}
