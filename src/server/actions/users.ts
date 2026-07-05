"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { actionUser } from "@/server/authz";
import { ROLES } from "@/server/db/schema";
import type { ActionResult } from "./public";

const createUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(ROLES),
});

const setUserRoleSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.enum(ROLES),
});

function revalidateUsers() {
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
}

function actionError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function createDashboardUser(
  input: z.infer<typeof createUserSchema>,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await auth.api.createUser({
      headers: await headers(),
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: parsed.data.role as "admin",
      },
    });
  } catch (error) {
    return { ok: false, error: actionError(error, "Failed to create user") };
  }

  revalidateUsers();
  return { ok: true, message: "User created" };
}

export async function setDashboardUserRole(
  input: z.infer<typeof setUserRoleSchema>,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };
  if (actor.id === input.userId) {
    return { ok: false, error: "You cannot change your own role" };
  }

  const parsed = setUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await auth.api.setRole({
      headers: await headers(),
      body: {
        userId: parsed.data.userId,
        role: parsed.data.role as "admin",
      },
    });
  } catch (error) {
    return { ok: false, error: actionError(error, "Failed to update role") };
  }

  revalidateUsers();
  return { ok: true, message: "Role updated" };
}

export async function removeDashboardUser(
  userId: string,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };
  if (actor.id === userId) {
    return { ok: false, error: "You cannot delete your own account" };
  }

  try {
    await auth.api.removeUser({
      headers: await headers(),
      body: { userId },
    });
  } catch (error) {
    return { ok: false, error: actionError(error, "Failed to delete user") };
  }

  revalidateUsers();
  return { ok: true, message: "User deleted" };
}
