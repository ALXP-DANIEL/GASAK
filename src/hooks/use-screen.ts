import * as React from "react";

const SCREEN_BREAKPOINT = 768;

export type ScreenTarget = "mobile" | "desktop";

export function useScreen(target: ScreenTarget) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const query =
      target === "mobile"
        ? `(max-width: ${SCREEN_BREAKPOINT - 1}px)`
        : `(min-width: ${SCREEN_BREAKPOINT}px)`;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    mql.addEventListener("change", onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, [target]);

  return !!matches;
}
