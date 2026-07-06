import { BrandCard, LinkButton, PageHero } from "@components/ui/brand";
import { createPageMetadata } from "@lib/metadata";

export const metadata = createPageMetadata({
  title: "Demo Lab",
  description: "Internal GASAK demo routes for validating reusable UI states.",
  path: "/demo",
  type: "Demo",
});

const DEMO_SECTIONS = [
  {
    href: "/demo/status",
    title: "Status Pages",
    description:
      "Trigger the enterprise error surfaces: 401, 403, 404, and 500.",
  },
  {
    href: "/demo/accent",
    title: "Accent Themes",
    description:
      "Preview how squad accent colors override primary, ring, badge, and panel styling.",
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8">
        <PageHero
          eyebrow="Demo Lab"
          title="Reusable interface demos"
          description="Use this area as a safe place to preview and trigger UI states before wiring them into production flows."
        />

        <section className="grid gap-4 md:grid-cols-2">
          {DEMO_SECTIONS.map((section) => (
            <BrandCard key={section.href} className="p-6">
              <h2 className="font-heading text-2xl font-bold tracking-wide">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {section.description}
              </p>
              <div className="mt-5">
                <LinkButton href={section.href} caret>
                  Open demo
                </LinkButton>
              </div>
            </BrandCard>
          ))}
        </section>
      </div>
    </main>
  );
}
