"use client";

import { useEffect, useState } from "react";

/** Keep in sync with the .splash-overlay animation timings in esports.css. */
const SPLASH_TOTAL_MS = 900;

/**
 * Brand flourish overlay shown briefly on first paint. Content underneath
 * renders from the very first frame (it is never hidden), so LCP and
 * interactivity are unaffected; the overlay fades out via pure CSS, which
 * runs even before hydration. JS only unmounts it once the fade is done.
 */
export default function SplashGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDone(true), SPLASH_TOTAL_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      {!done && (
        <output
          aria-label="Loading application"
          className="splash-overlay fixed inset-0 z-300 grid place-items-center bg-background text-foreground"
        >
          <div className="splash-line h-px bg-foreground/35" />
        </output>
      )}
    </>
  );
}
