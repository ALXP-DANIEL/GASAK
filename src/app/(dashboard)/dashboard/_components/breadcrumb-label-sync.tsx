"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  clearBreadcrumbLabel,
  setBreadcrumbLabel,
} from "./breadcrumb-label-store";

/**
 * Rendered by `PageHeader` on detail pages that pass `breadcrumbLabel`.
 * Publishes the record's real name for the current route so the
 * breadcrumb trail can show it instead of the raw id segment.
 */
export function BreadcrumbLabelSync({ label }: { label: string }) {
  const pathname = usePathname();

  useEffect(() => {
    setBreadcrumbLabel(pathname, label);
    return () => clearBreadcrumbLabel(pathname);
  }, [pathname, label]);

  return null;
}
