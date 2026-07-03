import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/shadcn/card";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "More",
  description: "Everything else GASAK.",
  path: "/more",
});

const LINKS = [
  { href: "/about", title: "About GASAK", body: "Our story and values" },
  { href: "/players", title: "Players", body: "Every registered player" },
  {
    href: "/recruitment",
    title: "Recruitment",
    body: "Apply to join a squad",
  },
  { href: "/contact", title: "Contact", body: "Get in touch with the team" },
  {
    href: "/login",
    title: "Member Login",
    body: "Dashboard for players, leaders, sellers and admins",
  },
];

export default function MorePage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-bold tracking-tight">More</h1>
      <div className="grid gap-3">
        {LINKS.map(({ href, title, body }) => (
          <Link key={href} href={href}>
            <Card className="hover-lift">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
                <CaretRight size={18} className="text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
