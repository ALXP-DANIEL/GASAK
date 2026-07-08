"use client";

import StatusPage from "@components/layout/status-page";
import { authClient } from "@lib/auth-client";
import { useRouter } from "next/navigation";

export default function ForbiddenContent() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();

    router.push("/login");
    router.refresh();
  }

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
          href: "#",
          label: "Log out",
          variant: "danger",
          onAction: handleLogout,
        },
      ]}
    />
  );
}
