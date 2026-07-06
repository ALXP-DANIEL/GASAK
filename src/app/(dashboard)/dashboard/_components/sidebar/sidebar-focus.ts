import type { DashboardAccess } from "@/config/dashboard";

export type SidebarFocus = "manage" | "player";

export const SIDEBAR_FOCUS_COOKIE = "gasak_sidebar_focus";

export function parseSidebarFocus(value: string | undefined): SidebarFocus {
  return value === "player" ? "player" : "manage";
}

/**
 * Admins/sellers who also belong to a squad wear two hats: their org-wide
 * role and their squad role (possibly squad leader/coach). Only they get the
 * Manage/Player toggle — everyone else always sees their one real context.
 */
export function canToggleFocus(access: DashboardAccess) {
  return access.hasSquad && access.orgRole !== "user";
}

/**
 * Applies the Manage/Player split to a real access snapshot. Manage shows
 * only org-level items (squad access is suppressed); Player shows only
 * squad-level items (org role is downgraded to "user"). Used identically on
 * the client (sidebar nav) and the server (dashboard home, reports) so both
 * stay in sync with the same cookie.
 */
export function resolveDashboardAccess(
  access: DashboardAccess,
  focus: SidebarFocus,
): DashboardAccess {
  if (!canToggleFocus(access)) return access;
  return focus === "player"
    ? { ...access, orgRole: "user" }
    : { ...access, hasSquad: false, managesSquad: false };
}
