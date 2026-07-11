"use server";

import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@features/auth/schema";
import type {
  AuthActionResult,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@features/auth/types";
import { auth } from "@server/auth";
import { db, user } from "@server/db";
import { requireUser } from "@server/session";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

function authError(error: unknown) {
  return error instanceof Error ? error.message : "Authentication failed";
}

export async function requestPasswordReset(
  input: ForgotPasswordInput,
): Promise<AuthActionResult<{ status: boolean; message: string }>> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const result = await auth.api.requestPasswordReset({
      body: {
        email: parsed.data.email,
        redirectTo: "/reset-password",
      },
    });
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: authError(error) };
  }
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<AuthActionResult<{ status: boolean }>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const result = await auth.api.resetPassword({
      body: {
        newPassword: parsed.data.password,
        token: parsed.data.token,
      },
    });
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: authError(error) };
  }
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<
  AuthActionResult<Awaited<ReturnType<typeof auth.api.changePassword>>>
> {
  const actor = await requireUser();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const result = await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      },
    });
    await db
      .update(user)
      .set({ mustChangePassword: false })
      .where(eq(user.id, actor.id));
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: authError(error) };
  }
}
