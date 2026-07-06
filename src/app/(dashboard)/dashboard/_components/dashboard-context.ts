import { cookies } from "next/headers";
import type { DashboardAccess } from "@/config/dashboard";
import { requireUser, type SessionUser, userOrgRole } from "@/lib/session";
import {
  getManagedSquadIds,
  getMemberSquadIds,
  getPrimarySquadRole,
} from "@/server/authz";
import type { SquadRole } from "@/server/db";
import {
  parseSidebarFocus,
  resolveDashboardAccess,
  SIDEBAR_FOCUS_COOKIE,
  type SidebarFocus,
} from "./sidebar/sidebar-focus";

export type DashboardContext = {
  user: SessionUser;
  /** Real access — the user's actual org role and squad standing. */
  access: DashboardAccess;
  /** Access after applying the Manage/Player sidebar focus. */
  effectiveAccess: DashboardAccess;
  /** The user's highest-authority squad role, if they belong to a squad. */
  primarySquadRole: SquadRole | null;
  focus: SidebarFocus;
};

/**
 * Composes the session, squad membership, and the Manage/Player focus
 * cookie into a single access snapshot. Use this on any dashboard page that
 * needs to honor the sidebar's focus toggle, so the logic lives in one place
 * instead of being re-derived per page.
 */
export async function getDashboardContext(): Promise<DashboardContext> {
  const user = await requireUser();
  const orgRole = userOrgRole(user);
  const [cookieStore, memberSquadIds, managedSquadIds, primarySquadRole] =
    await Promise.all([
      cookies(),
      getMemberSquadIds(user.id),
      getManagedSquadIds(user.id),
      getPrimarySquadRole(user.id),
    ]);

  const access: DashboardAccess = {
    orgRole,
    hasSquad: memberSquadIds.length > 0,
    managesSquad: managedSquadIds.length > 0,
  };
  const focus = parseSidebarFocus(cookieStore.get(SIDEBAR_FOCUS_COOKIE)?.value);

  return {
    user,
    access,
    effectiveAccess: resolveDashboardAccess(access, focus),
    primarySquadRole,
    focus,
  };
}
