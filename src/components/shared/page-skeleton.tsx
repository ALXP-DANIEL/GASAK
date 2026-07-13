"use client";

import { Skeleton as ShadcnSkeleton } from "@components/ui/shadcn/skeleton";
import { configureBoneyard, Skeleton } from "boneyard-js/react";
import "@/bones/registry";

configureBoneyard({
  color: "var(--muted)",
  darkColor: "var(--muted)",
  shimmerColor: "var(--accent)",
  darkShimmerColor: "var(--accent)",
});

/**
 * Shared boneyard wrapper for dashboard module pages. Each route gets a
 * unique `name` — bones for it are captured by `npx boneyard-js build`
 * (see scripts/capture-bones.sh) and replayed here via the generated
 * `@/bones/registry`. `fallback` covers the gap before bones exist yet.
 */
export function PageSkeleton({
  name,
  loading,
  fallback = <GenericFallback />,
  children,
}: {
  name: string;
  loading: boolean;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Skeleton
      name={name}
      loading={loading}
      animate="shimmer"
      stagger
      transition
      fallback={fallback}
    >
      {children}
    </Skeleton>
  );
}

function GenericFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-b pb-5">
        <ShadcnSkeleton className="h-3 w-24" />
        <ShadcnSkeleton className="mt-2 h-8 w-56" />
      </div>
      <ShadcnSkeleton className="h-40 w-full" />
      <ShadcnSkeleton className="h-64 w-full" />
    </div>
  );
}
