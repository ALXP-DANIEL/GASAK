"use client";

import StatusPage from "@components/layout/status-page";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      className="min-h-dvh"
      code="500"
      eyebrow="Application error"
      title="Something failed while loading this view."
      description="The request reached GASAK, but the interface could not finish rendering. Retry the view, or return to the archived home screen if it keeps failing."
      actions={[
        {
          href: "#",
          label: "Try again",
          onAction: reset,
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
