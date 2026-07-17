import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const personalEmailRequestSchema = z.object({
  email: z.email("Enter a valid personal email"),
});

export const personalEmailConfirmSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from the email"),
});
