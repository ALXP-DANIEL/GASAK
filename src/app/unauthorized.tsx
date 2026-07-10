"use client";

import StatusPage from "@components/layout/status-page";
import { authClient } from "@lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Unauthorized() {
  const router = useRouter();

  // Landing here means the server rejected the session cookie (missing,
  // expired, or revoked). Clear it proactively — otherwise the stale
  // cookie makes middleware think we're still logged in, which bounces
  // /login straight back to the page that just 401'd (infinite loop).
  useEffect(() => {
    authClient.signOut();
  }, []);

  async function handleSignIn() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <StatusPage
      className="min-h-dvh"
      code="401"
      eyebrow="Authentication required"
      title="Sign in to continue."
      description="This area needs a verified GASAK session before we can show squad, shop, or admin data."
      actions={[
        {
          href: "/login",
          label: "Sign in",
          onAction: handleSignIn,
        },
        {
          href: "/",
          label: "Back home",
          variant: "ghost",
        },
      ]}
    />
  );
}
