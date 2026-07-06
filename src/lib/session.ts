import type { OrgRole } from "@server/db";
import { headers } from "next/headers";
import { forbidden, unauthorized } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof getSession>>
>["user"];

export function userOrgRole(user: { role?: string | null }): OrgRole {
  if (user.role === "admin") return "admin";
  if (user.role === "seller") return "seller";
  return "user";
}

// Temporary alias while call sites migrate to userOrgRole
export const userRole = userOrgRole;

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) unauthorized();
  return session.user;
}

export async function requireOrgRole(
  ...roles: OrgRole[]
): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(userOrgRole(user))) forbidden();
  return user;
}

// Temporary alias while call sites migrate to requireOrgRole
export const requireRole = requireOrgRole;
