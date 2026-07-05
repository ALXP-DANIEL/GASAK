import { LinkButton, PageHero } from "@/components/ui/brand";
import { createPageMetadata } from "@/lib/metadata";
import { AccentPlayground } from "./accent-playground";

export const metadata = createPageMetadata({
  title: "Accent Theme Demo",
  description: "Preview squad accent color behavior across GASAK UI surfaces.",
  path: "/demo/accent",
  type: "Demo",
});

export default function AccentDemoPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8">
        <PageHero
          eyebrow="Demo Lab"
          title="Squad accent themes"
          description="Each preview scopes CSS variables through the Accent component, so the same UI can inherit a squad-specific color without changing component code."
        >
          <LinkButton href="/demo" variant="outline">
            Back to demos
          </LinkButton>
        </PageHero>

        <AccentPlayground />
      </div>
    </main>
  );
}
