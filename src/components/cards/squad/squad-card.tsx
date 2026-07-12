import { ContentCardFrame, contentCardSize } from "@components/cards/shared";
import { Icons } from "@components/icons";
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
    <ContentCardFrame
      interactive
      className={cn(contentCardSize.compact, "items-center p-6 text-center")}
    >
      <span
        className={cn(
          "inline-flex items-center border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
          development
            ? "border-destructive/40 text-destructive"
            : "border-primary/40 text-primary",
        )}
      >
        {development ? "Development" : "Competitive"}
      </span>

      <SquadLogo
        squad={squad}
        className="mt-5 size-24 transition-transform duration-300 group-hover:scale-105"
        size={96}
      />

      <h3 className="mt-4 line-clamp-2 text-balance font-heading text-lg font-semibold uppercase leading-snug tracking-wide">
        {squad.name}
      </h3>

      <LinkButton
        href={`/squads/${squad.id}`}
        variant="outline"
        size="sm"
        caret
        className="mt-auto w-full"
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
    <Link href={`/squads/${squad.id}`} className="block h-full">
      <ContentCardFrame interactive className={contentCardSize.default}>
        <div className="relative h-40 w-full overflow-hidden bg-secondary">
          {squad.bannerUrl && (
            <Image
              src={squad.bannerUrl}
              alt={`${squad.name} banner`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-card to-transparent"
          />
        </div>

        <div className="relative flex flex-1 flex-col p-6 pt-0">
          <div className="-mt-8 flex items-end gap-4">
            <SquadLogo squad={squad} className="size-16 shrink-0" size={64} />
            <div className="min-w-0 pb-1">
              <h2 className="truncate font-heading text-xl font-semibold uppercase tracking-wide transition-colors group-hover:text-primary">
                {squad.name}
              </h2>
              {typeof memberCount === "number" && (
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icons.Domain.Members size={12} aria-hidden />
                  {memberCount} player{memberCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>

          <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {squad.description}
          </p>

          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/70 transition-colors group-hover:text-primary">
            Squad profile
            <Icons.Layout.Navigation.CaretRight size={13} aria-hidden />
          </span>
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
        "flex items-center justify-center overflow-hidden rounded-md border-2 border-primary/40 bg-background",
        className,
      )}
    >
      <Image
        src={squad.logoUrl ?? "/images/gasak-logo.png"}
        alt={`${squad.name} logo`}
        width={size}
        height={size}
        className="size-full object-cover"
      />
    </div>
  );
}
