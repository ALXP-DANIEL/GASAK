import { ContentCardFrame, contentCardSize } from "@components/cards/shared";
import { LinkButton } from "@components/ui/brand";
import { cn } from "@lib/utils";
import type { Squad } from "@server/db/schema";
import Image from "next/image";

export type SquadCardProps = {
  squad: Squad;
};

export function isDevelopmentSquad(squad: Pick<Squad, "name" | "description">) {
  return /academy|development|junior/i.test(
    `${squad.name} ${squad.description ?? ""}`,
  );
}

/** Showcase tile used on the home page squads section. For list pages, use
 * `SquadRowCard` from `@features/squads/components/squad-shared`. */
export function SquadCard({ squad }: SquadCardProps) {
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
