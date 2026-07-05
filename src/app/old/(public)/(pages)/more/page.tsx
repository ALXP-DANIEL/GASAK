import Link from "next/link";
import { Icons } from "@/components/icons";
import { BrandCard, PageHero } from "@/components/ui/brand";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "More",
  description: "Everything else GASAK.",
  path: "/old/more",
});

const LINKS = [
  { href: "/old/about", title: "About GASAK", body: "Our story and values" },
  { href: "/old/players", title: "Players", body: "Every registered player" },
  {
    href: "/old/recruitment",
    title: "Recruitment",
    body: "Apply to join a squad",
  },
  {
    href: "/old/contact",
    title: "Contact",
    body: "Get in touch with the team",
  },
  {
    href: "/old/login",
    title: "Member Login",
    body: "Dashboard for players, leaders, sellers and admins",
  },
];

export default function MorePage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHero
        eyebrow="More"
        title="Explore GASAK"
        description="Quick routes into the team, roster, recruitment, contact, and member dashboard."
      />
      <div className="grid gap-3">
        {LINKS.map(({ href, title, body }) => (
          <Link key={href} href={href}>
            <BrandCard className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="font-heading text-lg font-semibold tracking-wide">
                  {title}
                </p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
              <Icons.Layout.Navigation.CaretRight
                size={18}
                className="shrink-0 text-primary"
              />
            </BrandCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
