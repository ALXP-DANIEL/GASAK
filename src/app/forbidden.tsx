import StatusPage from "@/components/layout/status-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Forbidden",
  description: "Your current GASAK role cannot access this resource.",
  path: "/403",
  type: "Error 403",
});

export default function Forbidden() {
  return (
    <StatusPage
      className="min-h-dvh"
      code="403"
      eyebrow="Access denied"
      title="Your role cannot open this area."
      description="The page exists, but it is restricted to another GASAK role or a higher permission level."
      actions={[
        {
          href: "/dashboard",
          label: "Back to dashboard",
        },
        {
          href: "/old",
          label: "Back home",
          variant: "ghost",
        },
      ]}
    />
  );
}
