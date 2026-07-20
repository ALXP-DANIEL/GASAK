"use client";

import { configureBoneyard, Skeleton } from "boneyard-js/react";
import "@/bones/registry";
import { useEffect, useSyncExternalStore } from "react";

configureBoneyard({
  color: "var(--muted)",
  darkColor: "var(--muted)",
  shimmerColor: "var(--accent)",
  darkShimmerColor: "var(--accent)",
});

/** Which role-specific home layout the user last saw — one bone set each. */
export type HomeVariant = "admin" | "seller" | "squad";

const VARIANT_COOKIE = "gasak-home-variant";
const VARIANTS: HomeVariant[] = ["admin", "seller", "squad"];

const skeletonProps = {
  animate: "shimmer",
  stagger: true,
  transition: true,
} as const;

/**
 * Wraps the real dashboard home content. Each role layout gets its own bone
 * set (`home-admin` / `home-seller` / `home-squad`), captured by
 * `npx boneyard-js build` while logged in as the matching seeded account.
 * Also remembers the variant in a cookie so `loading.tsx` can replay the
 * right bones on the next navigation, before the server knows the role.
 */
export function DashboardHomeSkeleton({
  variant,
  children,
}: {
  variant: HomeVariant;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // biome-ignore lint/suspicious/noDocumentCookie: plain hint cookie; CookieStore API is still async/Chrome-only
    document.cookie = `${VARIANT_COOKIE}=${variant};path=/;max-age=31536000;samesite=lax`;
  }, [variant]);

  return (
    <Skeleton name={`home-${variant}`} loading={false} {...skeletonProps}>
      {children}
    </Skeleton>
  );
}

function readVariantCookie(): HomeVariant | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${VARIANT_COOKIE}=(\\w+)`),
  );
  const value = match?.[1] as HomeVariant | undefined;
  return value && VARIANTS.includes(value) ? value : null;
}

const noopSubscribe = () => () => {};

/**
 * Rendered by `loading.tsx`. Picks the bone set for the variant the user last
 * saw (via cookie); falls back to the hand-drawn placeholder on first visit
 * or during SSR where the cookie isn't readable.
 */
export function DashboardHomeLoading({
  fallback,
}: {
  fallback: React.ReactNode;
}) {
  const variant = useSyncExternalStore(
    noopSubscribe,
    readVariantCookie,
    () => null,
  );

  if (!variant) return <>{fallback}</>;

  return (
    <Skeleton
      name={`home-${variant}`}
      loading
      fallback={fallback}
      {...skeletonProps}
    >
      {null}
    </Skeleton>
  );
}
