"use server";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@features/auth/schema";
import type {
  AuthActionResult,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@features/auth/types";
import { auth } from "@server/auth";

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
