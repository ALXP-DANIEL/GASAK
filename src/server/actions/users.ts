"use server";

import { logActivity } from "@server/activity-log";
import { auth } from "@server/auth";
import { actionUser } from "@server/authz";
import { db, user } from "@server/db";
import { ORG_ROLES } from "@server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { ActionResult } from "./public";

const createUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(ORG_ROLES),
});

const setUserRoleSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.enum(ORG_ROLES),
});

const updateUserSchema = z.object({
  userId: z.string().min(1, "User is required"),
  name: z.string().min(2, "Name is required"),
  email: z.email("Enter a valid email"),
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
    const created = await auth.api.createUser({
      headers: await headers(),
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: parsed.data.role as "admin",
      },
    });
    await logActivity({
      actor,
      action: "create",
      entityType: "user",
      entityId: created.user.id,
      description: `Created ${parsed.data.role} user ${parsed.data.email}`,
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
    await logActivity({
      actor,
      action: "update",
      entityType: "user",
      entityId: parsed.data.userId,
      description: `Changed user role to ${parsed.data.role}`,
    });
  } catch (error) {
    return { ok: false, error: actionError(error, "Failed to update role") };
  }

  revalidateUsers();
  return { ok: true, message: "Role updated" };
}

export async function updateDashboardUser(
  input: z.infer<typeof updateUserSchema>,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const existing = await db.query.user.findFirst({
    where: eq(user.email, parsed.data.email),
  });
  if (existing && existing.id !== parsed.data.userId) {
    return { ok: false, error: "Another user already has that email" };
  }

  const [row] = await db
    .update(user)
    .set({ name: parsed.data.name, email: parsed.data.email })
    .where(eq(user.id, parsed.data.userId))
    .returning();
  if (!row) return { ok: false, error: "User not found" };

  await logActivity({
    actor,
    action: "update",
    entityType: "user",
    entityId: row.id,
    description: `Updated user details for ${row.email}`,
  });

  revalidateUsers();
  return { ok: true, message: "User updated" };
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
    await logActivity({
      actor,
      action: "delete",
      entityType: "user",
      entityId: userId,
      description: "Deleted dashboard user",
    });
  } catch (error) {
    return { ok: false, error: actionError(error, "Failed to delete user") };
  }

  revalidateUsers();
  return { ok: true, message: "User deleted" };
}
