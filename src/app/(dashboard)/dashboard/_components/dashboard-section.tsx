import { forbidden } from "next/navigation";
import { requireUser, userRole } from "@/lib/session";
import type { Role } from "@/server/db";

export async function requireDashboardRole(...roles: Role[]) {
  const user = await requireUser();
  const role = userRole(user);

  if (roles.length > 0 && !roles.includes(role)) {
    forbidden();
  }

  return { user, role };
}
