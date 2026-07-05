import { SquadCard } from "@/components/old/public/content-cards";
import { LinkButton, SectionHeader } from "@/components/ui/brand";
import type { Squad } from "@/server/db/schema";

export function SquadsSection({ squads }: { squads: Squad[] }) {
  if (squads.length === 0) return null;

  return (
    <section
      id="squads"
      className="mx-auto w-full max-w-7xl px-4 py-14 lg:px-8"
    >
      <SectionHeader
        eyebrow="Our Squads"
        title="Built different. Built to win."
      />

      <div className="mt-10 grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {squads.map((squad) => (
          <SquadCard key={squad.id} squad={squad} />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <LinkButton href="/squads" caret>
          View all squads
        </LinkButton>
      </div>
    </section>
  );
}
