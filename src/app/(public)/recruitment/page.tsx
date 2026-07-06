import { Icons } from "@components/icons";
import { BrandCard, LinkButton } from "@components/ui/brand";
import { createPageMetadata } from "@lib/metadata";
import { db, squads } from "@server/db";
import { and, eq } from "drizzle-orm";
import { ApplicationForm } from "./application-form";

export const metadata = createPageMetadata({
  title: "Recruitment",
  description: "Apply to join a GASAK Esports squad.",
  path: "/recruitment",
});

export default async function RecruitmentPage() {
  const recruitingSquads = await db
    .select({ id: squads.id, name: squads.name })
    .from(squads)
    .where(and(eq(squads.archived, false), eq(squads.recruiting, true)))
    .orderBy(squads.name);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 desktop:px-8 desktop:py-14">
      <section className="grid gap-8 border-b border-primary/20 pb-10 desktop:grid-cols-[minmax(0,1fr)_24rem] desktop:items-end">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Join GASAK
          </p>
          <h1 className="mt-3 text-balance font-heading text-4xl font-bold uppercase leading-tight tracking-wide desktop:text-6xl">
            Earn your slot
            <span className="block text-primary">through the trial.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground desktop:text-base desktop:leading-8">
            Tell us your rank, lane, hero pool, availability, and competitive
            background. Recruiters review every application and reach out by
            email or WhatsApp when there is a fit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/squads" caret>
              View squads
            </LinkButton>
            <LinkButton href="/contact" caret>
              Contact team
            </LinkButton>
          </div>
        </div>

        <BrandCard interactive={false} className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Trial focus
          </p>
          <div className="mt-5 grid gap-4">
            <RecruitmentMetric value="01" label="Application review" />
            <RecruitmentMetric value="02" label="Role and hero check" />
            <RecruitmentMetric value="03" label="Scrim or interview invite" />
          </div>
        </BrandCard>
      </section>

      <section className="grid gap-8 desktop:grid-cols-[22rem_minmax(0,1fr)] desktop:items-start">
        <aside className="grid gap-4 desktop:sticky desktop:top-24">
          <BrandCard interactive={false} className="p-6">
            <span className="grid size-12 place-items-center border border-primary/30 text-primary">
              <Icons.Domain.Recruitment size={24} />
            </span>
            <h2 className="mt-5 font-heading text-2xl font-bold uppercase tracking-wide">
              What we look for
            </h2>
            <div className="mt-5 grid gap-4">
              <RequirementItem
                title="Reliable schedule"
                body="Clear availability for practice, trial sessions, and tournament commitments."
              />
              <RequirementItem
                title="Defined role"
                body="A preferred lane with enough hero depth to handle drafts and bans."
              />
              <RequirementItem
                title="Coachability"
                body="Players who can review mistakes, take feedback, and improve with the squad."
              />
            </div>
          </BrandCard>

          <BrandCard interactive={false} className="p-6">
            <h2 className="font-heading text-xl font-bold uppercase tracking-wide">
              Before submitting
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Use real contact details. If the profile looks promising, the team
              will contact you for the next step.
            </p>
          </BrandCard>
        </aside>

        <ApplicationForm squads={recruitingSquads} />
      </section>
    </main>
  );
}

function RecruitmentMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <span className="font-heading text-3xl font-bold text-primary">
        {value}
      </span>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function RequirementItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid gap-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2">
        <Icons.Status.Success size={16} className="text-primary" />
        <h3 className="font-heading text-lg font-bold uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
