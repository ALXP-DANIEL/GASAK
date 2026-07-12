"use client";

import { configureBoneyard, Skeleton } from "boneyard-js/react";
import "@/bones/registry";

configureBoneyard({
  color: "var(--muted)",
  darkColor: "var(--muted)",
  shimmerColor: "var(--accent)",
  darkShimmerColor: "var(--accent)",
});

export function DashboardHomeSkeleton({
  loading,
  fallback,
  children,
}: {
  loading: boolean;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Skeleton
      name="dashboard-home"
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
