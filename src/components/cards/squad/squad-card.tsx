import { ContentCardFrame, contentCardSize } from "@components/cards/shared";
import { LinkButton } from "@components/ui/brand";
import { cn } from "@lib/utils";
import type { Squad } from "@server/db/schema";
import Image from "next/image";
import Link from "next/link";

export type SquadCardVariant = "compact" | "default";

export type SquadCardProps = {
  squad: Squad;
  memberCount?: number;
  variant?: SquadCardVariant;
};

export function isDevelopmentSquad(squad: Pick<Squad, "name" | "description">) {
  return /academy|development|junior/i.test(
    `${squad.name} ${squad.description ?? ""}`,
  );
}

export function SquadCard({
  squad,
  memberCount,
  variant = "compact",
}: SquadCardProps) {
  if (variant === "compact") {
    return <CompactSquadCard squad={squad} />;
  }

  return <DefaultSquadCard squad={squad} memberCount={memberCount} />;
}

function CompactSquadCard({ squad }: Pick<SquadCardProps, "squad">) {
  const development = isDevelopmentSquad(squad);

  return (
    <ContentCardFrame className="min-h-72 items-center p-4 text-center desktop:p-5">
      <SquadLogo squad={squad} className="size-20 desktop:size-28" size={112} />
      <h3 className="mt-3 line-clamp-2 font-heading text-sm font-bold uppercase tracking-wide desktop:text-base">
        {squad.name}
      </h3>
      <p
        className={cn(
          "mt-1 text-[11px] desktop:text-xs",
          development ? "text-destructive" : "text-primary",
        )}
      >
        {development ? "Development Squad" : "Competitive Squad"}
      </p>
      <LinkButton
        href={`/squads/${squad.id}`}
        size="sm"
        caret
        className="mt-auto"
      >
        View squad
      </LinkButton>
    </ContentCardFrame>
  );
}

function DefaultSquadCard({
  squad,
  memberCount,
}: Pick<SquadCardProps, "squad" | "memberCount">) {
  return (
    <Link href={`/squads/${squad.id}`} className="h-full">
      <ContentCardFrame className={contentCardSize.default}>
        {squad.bannerUrl && (
          <div className="relative h-32 w-full">
            <Image
              src={squad.bannerUrl}
              alt={`${squad.name} banner`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-3">
            <SquadLogo squad={squad} className="size-10" size={40} />
            <div>
              <h2 className="font-heading text-xl font-bold tracking-wide">
                {squad.name}
              </h2>
              {typeof memberCount === "number" && (
                <p className="text-sm text-muted-foreground">
                  {memberCount} player{memberCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
            {squad.description}
          </p>
        </div>
      </ContentCardFrame>
    </Link>
  );
}

function SquadLogo({
  squad,
  className,
  size,
}: {
  squad: Squad;
  className: string;
  size: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-background",
        className,
      )}
    >
      <Image
        src={squad.logoUrl ?? "/images/gasak-logo.png"}
        alt={`${squad.name} logo`}
        width={size}
        height={size}
        className="size-full object-cover"
        unoptimized={Boolean(squad.logoUrl)}
      />
    </div>
  );
}
