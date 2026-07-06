"use client";

import { useEffect } from "react";
import "@styles/globals.css";

export default function GlobalError({
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
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <main className="flex min-h-dvh items-center justify-center px-4 py-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Critical system error
            </p>
            <p className="mt-4 text-[4.5rem] font-semibold leading-none tracking-[-0.08em] text-primary sm:text-[5.5rem]">
              500
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              The app shell could not recover.
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              A root-level failure interrupted the interface. Retry the shell,
              or return to the archived home screen.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => unstable_retry()}
                className="rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/25"
              >
                Try again
              </button>
              <a
                href="/old"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Back home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
