"use client";

import { Icons } from "@components/icons";

export function ScrollTopButton() {
  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="flex size-8 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground transition-opacity hover:opacity-90"
    >
      <Icons.Layout.ScrollTop size={16} weight="bold" />
    </button>
  );
}
