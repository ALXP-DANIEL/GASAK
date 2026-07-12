"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@components/ui/shadcn/breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  getBreadcrumbLabelSnapshot,
  subscribeBreadcrumbLabel,
} from "./breadcrumb-label-store";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Catches opaque database ids that aren't dashed UUIDs too — e.g. better-auth's
 * nanoid-style ids (`wUI2clBeKf66auLjt7dWOMQbFu3KdTyu`). A real slug segment
 * is lowercase-with-dashes; an id like this mixes case and digits with no
 * separators, which a human-authored route segment never does.
 */
function looksLikeOpaqueId(segment: string) {
  if (UUID_PATTERN.test(segment)) return true;
  return (
    segment.length >= 16 &&
    /^[A-Za-z0-9_-]+$/.test(segment) &&
    /[a-z]/.test(segment) &&
    /[A-Z]/.test(segment) &&
    /[0-9]/.test(segment)
  );
}

function formatSegment(segment: string) {
  if (looksLikeOpaqueId(segment)) return "Details";
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const labelSnapshot = useSyncExternalStore(
    subscribeBreadcrumbLabel,
    getBreadcrumbLabelSnapshot,
    () => null,
  );
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== "dashboard");

  if (segments.length === 0) {
    return <span className="text-sm font-medium">Dashboard</span>;
  }

  const registeredLabel =
    labelSnapshot?.path === pathname ? labelSnapshot.label : null;

  function labelFor(segment: string, isLast: boolean) {
    if (isLast && registeredLabel) return registeredLabel;
    return formatSegment(segment);
  }

  const current = labelFor(segments[segments.length - 1], /* isLast */ true);

  return (
    <>
      {/* Mobile: current page only */}
      <span className="truncate text-sm font-medium desktop:hidden">
        {current}
      </span>
      {/* Desktop: full trail */}
      <Breadcrumb className="mobile:hidden">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/dashboard">Dashboard</Link>} />
          </BreadcrumbItem>
          {segments.map((segment, index) => {
            const href = `/dashboard/${segments.slice(0, index + 1).join("/")}`;
            const isLast = index === segments.length - 1;

            return (
              <div key={href} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{labelFor(segment, isLast)}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={<Link href={href}>{formatSegment(segment)}</Link>}
                    />
                  )}
                </BreadcrumbItem>
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
