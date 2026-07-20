import type { z } from "zod";
import type {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  personalEmailConfirmSchema,
  personalEmailRequestSchema,
  resetPasswordSchema,
} from "./schema";

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type PersonalEmailRequestInput = z.infer<
  typeof personalEmailRequestSchema
>;
export type PersonalEmailConfirmInput = z.infer<
  typeof personalEmailConfirmSchema
>;

export type AuthActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };
