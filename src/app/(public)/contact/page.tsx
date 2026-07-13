import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { BrandCard, LinkButton } from "@components/ui/brand";
import { siteConfig } from "@config/site";
import { createPageMetadata } from "@lib/metadata";

export const metadata = createPageMetadata({
  title: "Contact",
  description: "Get in touch with GASAK Esports.",
  path: "/contact",
  type: "Contact",
});

export default function ContactPage() {
  const channels = [
    {
      Icon: Icons.Contact.Email,
      title: "Email",
      description:
        "Sponsorships, tournaments, business, and general inquiries.",
      href: `mailto:${siteConfig.links.email}`,
      label: siteConfig.links.email,
    },
    {
      Icon: Icons.Social.Instagram,
      title: "Instagram",
      description: "Match updates, highlights, and news.",
      href: siteConfig.links.instagram,
      label: "@thealifhaker1",
    },
    {
      Icon: Icons.Social.Linkedin,
      title: "LinkedIn",
      description: "Business and partnership opportunities.",
      href: siteConfig.links.linkedin,
      label: "GASAK Esports",
    },
  ];

  return (
    <PageSkeleton name="contact" loading={false}>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 desktop:px-8 desktop:py-14">
        <section className="grid gap-8 border-b border-primary/20 pb-10 desktop:grid-cols-[minmax(0,1fr)_24rem] desktop:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Contact
            </p>
            <h1 className="mt-3 text-balance font-heading text-4xl font-bold uppercase leading-tight tracking-wide desktop:text-6xl">
              Talk to the
              <span className="block text-primary">GASAK team.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground desktop:text-base desktop:leading-8">
              Sponsorships, tournaments, business opportunities, squad
              inquiries, and community messages all start here. Pick the channel
              that matches your request and the team will route it properly.
            </p>
          </div>

          <BrandCard interactive={false} className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Fastest route
            </p>
            <h2 className="mt-3 font-heading text-2xl font-bold uppercase tracking-wide">
              Want to join?
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Player applications are reviewed from the recruitment form so
              ranks, lanes, and hero pools stay organized.
            </p>
            <LinkButton
              href="/recruitment"
              variant="solid"
              className="mt-6 w-full"
              caret
            >
              Apply now
            </LinkButton>
          </BrandCard>
        </section>

        <section className="grid gap-4 desktop:grid-cols-3">
          {channels.map(({ Icon, title, description, href, label }) => (
            <a key={title} href={href} target="_blank" rel="noreferrer">
              <BrandCard className="flex h-full flex-col p-6">
                <span className="grid size-12 place-items-center border border-primary/30 text-primary">
                  <Icon size={24} />
                </span>
                <h2 className="mt-6 font-heading text-2xl font-bold uppercase tracking-wide">
                  {title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">
                  {description}
                </p>
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
                  <p className="min-w-0 truncate text-sm font-semibold text-primary">
                    {label}
                  </p>
                  <Icons.Contact.ExternalLink
                    size={16}
                    className="shrink-0 text-muted-foreground"
                  />
                </div>
              </BrandCard>
            </a>
          ))}
        </section>

        <section className="grid gap-6 border-y border-primary/20 py-10 desktop:grid-cols-[18rem_minmax(0,1fr)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Routing
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold uppercase tracking-wide">
              Send the right signal
            </h2>
          </div>
          <div className="grid gap-4 desktop:grid-cols-3">
            <ContactStep
              index="01"
              title="Partnerships"
              body="Use email or LinkedIn for sponsorship decks, event invites, and business proposals."
            />
            <ContactStep
              index="02"
              title="Community"
              body="Use Instagram for social updates, quick messages, match highlights, and public announcements."
            />
            <ContactStep
              index="03"
              title="Recruitment"
              body="Use the recruitment page for player applications so the review team gets complete player details."
            />
          </div>
        </section>
      </main>
    </PageSkeleton>
  );
}

function ContactStep({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <div className="border-t border-border pt-4">
      <p className="font-mono text-sm text-primary">{index}</p>
      <h3 className="mt-3 font-heading text-xl font-bold uppercase tracking-wide">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
    </div>
  );
}
