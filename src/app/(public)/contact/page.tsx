import { Icons } from "@components/icons";
import { BrandFeatureCard, PageHero } from "@components/ui/brand";
import { siteConfig } from "@config/site";
import { createPageMetadata } from "@lib/metadata";

export const metadata = createPageMetadata({
  title: "Contact",
  description: "Get in touch with GASAK Esports.",
  path: "/contact",
});

export default function ContactPage() {
  const channels = [
    {
      Icon: Icons.Contact.Email,
      title: "Email",
      description: "Sponsorships, tournaments, and general inquiries.",
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
      <PageHero
        eyebrow="Contact"
        title="Reach the GASAK team"
        description="Sponsorships, tournaments, business opportunities, and community messages all start here."
      />

      <div className="grid gap-4 desktop:grid-cols-3">
        {channels.map(({ Icon, title, description, href, label }) => (
          <a key={title} href={href} target="_blank" rel="noreferrer">
            <BrandFeatureCard
              className="h-full"
              icon={<Icon size={28} />}
              title={title}
              description={description}
              footer={
                <p className="text-sm font-semibold text-primary">{label}</p>
              }
            />
          </a>
        ))}
      </div>
    </div>
  );
}
