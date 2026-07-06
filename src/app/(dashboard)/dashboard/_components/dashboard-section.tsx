import type { OrgRole } from "@server/db";
import { requireUser, userOrgRole } from "@server/session";
import { forbidden } from "next/navigation";

/**
 * Page guard checking the organization role only. Call with no arguments to
 * allow any logged-in user; squad-level access is checked per page via the
 * authz squad helpers.
 */
export async function requireDashboardRole(...roles: OrgRole[]) {
  const user = await requireUser();
  const role = userOrgRole(user);

  if (roles.length > 0 && !roles.includes(role)) {
    forbidden();
  }

  return { user, role };
}
