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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatSegment(segment: string) {
  if (UUID_PATTERN.test(segment)) return "Details";
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== "dashboard");

  if (segments.length === 0) {
    return <span className="text-sm font-medium">Dashboard</span>;
  }

  const current = formatSegment(segments[segments.length - 1]);

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
                    <BreadcrumbPage>{formatSegment(segment)}</BreadcrumbPage>
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
