import { ContentCardGrid, SquadCard } from "@components/cards";
import { LinkButton, SectionHeader } from "@components/ui/brand";
import type { Squad } from "@server/db/schema";

export function SquadsSection({ squads }: { squads: Squad[] }) {
  if (squads.length === 0) return null;

  return (
    <section
      id="squads"
      className="mx-auto w-full max-w-7xl px-4 py-14 desktop:px-8"
    >
      <SectionHeader
        eyebrow="Our Squads"
        title="Built different. Built to win."
      />

      <ContentCardGrid density="compact" className="mt-10">
        {squads.map((squad) => (
          <SquadCard key={squad.id} squad={squad} />
        ))}
      </ContentCardGrid>

      <div className="mt-8 flex flex-col items-center gap-4">
        <LinkButton href="/squads" caret>
          View all gasak squad
        </LinkButton>
        <div className="flex flex-col gap-3 desktop:flex-row">
          <LinkButton href="/squads/division/nexus" variant="outline" caret>
            View all nexus squad
          </LinkButton>
          <LinkButton href="/squads/division/velrix" variant="outline" caret>
            View all velrix squad
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
