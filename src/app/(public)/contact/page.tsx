import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { InstagramLogo } from "@phosphor-icons/react/dist/ssr/InstagramLogo";
import { LinkedinLogo } from "@phosphor-icons/react/dist/ssr/LinkedinLogo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Contact",
  description: "Get in touch with GASAK Esports.",
  path: "/contact",
});

export default function ContactPage() {
  const channels = [
    {
      Icon: EnvelopeSimple,
      title: "Email",
      description: "Sponsorships, tournaments, and general inquiries.",
      href: `mailto:${siteConfig.links.email}`,
      label: siteConfig.links.email,
    },
    {
      Icon: InstagramLogo,
      title: "Instagram",
      description: "Match updates, highlights, and announcements.",
      href: siteConfig.links.instagram,
      label: "@thealifhaker1",
    },
    {
      Icon: LinkedinLogo,
      title: "LinkedIn",
      description: "Business and partnership opportunities.",
      href: siteConfig.links.linkedin,
      label: "GASAK Esports",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
        <p className="mt-2 text-muted-foreground">
          Reach the GASAK team through any of these channels.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {channels.map(({ Icon, title, description, href, label }) => (
          <a key={title} href={href} target="_blank" rel="noreferrer">
            <Card className="h-full hover-lift">
              <CardHeader>
                <Icon size={28} className="text-primary" />
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{label}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
