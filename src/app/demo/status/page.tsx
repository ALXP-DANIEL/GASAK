import {
  BrandBadge,
  BrandCard,
  LinkButton,
  PageHero,
} from "@/components/ui/brand";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Status Page Demo",
  description: "Trigger GASAK status and error pages from one demo surface.",
  path: "/demo/status",
  type: "Demo",
});

const STATUS_TRIGGERS = [
  {
    code: "401",
    href: "/demo/status/unauthorized",
    title: "Unauthorized",
    description:
      "Triggers Next unauthorized(), rendering the authentication-required page.",
  },
  {
    code: "403",
    href: "/demo/status/forbidden",
    title: "Forbidden",
    description:
      "Triggers Next forbidden(), rendering the role access denied page.",
  },
  {
    code: "404",
    href: "/demo/status/not-found",
    title: "Not Found",
    description:
      "Triggers Next notFound(), rendering the not-found status page.",
  },
  {
    code: "500",
    href: "/demo/status/error",
    title: "Route Error",
    description:
      "Throws a server render error so the route error boundary appears.",
  },
];

export default function StatusDemoPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8">
        <PageHero
          eyebrow="Demo Lab"
          title="Status page triggers"
          description="Open each trigger to verify the status page behavior without temporarily editing route files."
        >
          <LinkButton href="/demo" variant="outline">
            Back to demos
          </LinkButton>
        </PageHero>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_TRIGGERS.map((trigger) => (
            <BrandCard key={trigger.code} className="flex flex-col p-6">
              <BrandBadge>{trigger.code}</BrandBadge>
              <h2 className="mt-4 font-heading text-2xl font-bold tracking-wide">
                {trigger.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                {trigger.description}
              </p>
              <div className="mt-5">
                <LinkButton href={trigger.href} caret className="w-full">
                  Trigger
                </LinkButton>
              </div>
            </BrandCard>
          ))}
        </section>

        <BrandCard className="p-6" interactive={false}>
          <h2 className="font-heading text-xl font-bold tracking-wide">
            Global error note
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The global error page is reserved for root layout failures. It is
            intentionally not triggered by a demo route because doing so would
            require crashing the app shell itself.
          </p>
        </BrandCard>
      </div>
    </main>
  );
}
