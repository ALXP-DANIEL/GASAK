import type { z } from "zod";
import type {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "./schema";

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type AuthActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };
