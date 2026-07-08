"use client";

import StatusPage from "@components/layout/status-page";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
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
          href: "#retry",
          label: "Try again",
        },
        {
          href: "/",
          label: "Back home",
          variant: "ghost",
        },
      ]}
      onAction={(href) => {
        if (href === "#retry") unstable_retry();
      }}
    />
  );
}
