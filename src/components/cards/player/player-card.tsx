import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/shadcn/avatar";
import { Badge } from "@components/ui/shadcn/badge";
import { initials } from "@lib/format";
import { formatLanes, SQUAD_ROLE_LABELS } from "@lib/labels";
import { formatRank, type MlbbRank } from "@lib/ranks";
import { cn } from "@lib/utils";
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

export type PlayerCardProps = {
  name: string;
  email?: string | null;
  image?: string | null;
  profile?: PlayerProfile | null;
  squadRole?: SquadRole;
  showContact?: boolean;
  className?: string;
};

export function PlayerCard({
  name,
  email,
  image,
  profile,
  squadRole,
  showContact,
  className,
}: PlayerCardProps) {
  const displayName = profile?.ign || profile?.nickname || name;
  const lane = formatLanes(profile?.preferredLanes);

  return (
    <article
      className={cn(
        "grid gap-4 rounded-md border border-border/70 bg-card/80 p-4 shadow-sm shadow-foreground/5 transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-12 border border-primary/25">
          <AvatarImage src={image ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-primary/10 font-heading font-bold text-primary">
            {initials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base font-bold uppercase tracking-normal">
            {displayName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{name}</p>
        </div>
        {squadRole && (
          <Badge variant={squadRole === "leader" ? "default" : "outline"}>
            {SQUAD_ROLE_LABELS[squadRole]}
          </Badge>
        )}
      </div>

      <div className="grid gap-2 text-xs">
        <PlayerDetail label="Lane" value={lane} />
        <PlayerDetail
          label="Current"
          value={formatRank(profile?.currentRank)}
        />
        <PlayerDetail label="Peak" value={formatRank(profile?.peakRank)} />
        {showContact && (
          <>
            <PlayerDetail
              label="MLBB"
              value={
                profile?.mlbbId
                  ? `${profile.mlbbId}${profile.serverId ? ` (${profile.serverId})` : ""}`
                  : "-"
              }
            />
            {email && <PlayerDetail label="Email" value={email} />}
            {profile?.phone && (
              <PlayerDetail label="Phone" value={profile.phone} />
            )}
          </>
        )}
      </div>
    </article>
  );
}

function PlayerDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/60 pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
