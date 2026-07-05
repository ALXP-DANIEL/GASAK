import { headers } from "next/headers";
import { forbidden, unauthorized } from "next/navigation";
import { cache } from "react";
import type { Role } from "@/server/db";
import { auth } from "./auth";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof getSession>>
>["user"];

export function userRole(user: { role?: string | null }): Role {
  return (user.role ?? "member") as Role;
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) unauthorized();
  return session.user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(userRole(user))) forbidden();
  return user;
}
