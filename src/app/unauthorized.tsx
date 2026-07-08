import StatusPage from "@components/layout/status-page";
import { createPageMetadata } from "@lib/metadata";

export const metadata = createPageMetadata({
  title: "Unauthorized",
  description: "Sign in before accessing this GASAK resource.",
  path: "/401",
  type: "Error 401",
});

export default function Unauthorized() {
  return (
    <StatusPage
      className="min-h-dvh"
      code="401"
      eyebrow="Authentication required"
      title="Sign in to continue."
      description="This area needs a verified GASAK session before we can show squad, shop, or admin data."
      actions={[
        {
          href: "/old/login",
          label: "Sign in",
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
