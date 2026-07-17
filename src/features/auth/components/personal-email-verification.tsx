"use client";

import { FormField, formFieldStyles } from "@components/forms/form-field";
import { Button } from "@components/ui/shadcn/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@components/ui/shadcn/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@components/ui/shadcn/input-otp";
import {
  personalEmailConfirmSchema,
  personalEmailRequestSchema,
} from "@features/auth/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  confirmPersonalEmailCode,
  requestPersonalEmailCode,
} from "@server/actions/personal-email";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

type RequestInput = z.infer<typeof personalEmailRequestSchema>;
type ConfirmInput = z.infer<typeof personalEmailConfirmSchema>;

/**
 * Two-step personal email capture: enter an inbox, receive a 6-digit code
 * there, confirm it. Used on first login (after the forced password change)
 * and in the dashboard prompt for accounts that predate personal emails.
 */
export function PersonalEmailVerification({
  onVerified,
}: {
  onVerified: (email: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const emailForm = useForm<RequestInput>({
    resolver: zodResolver(personalEmailRequestSchema),
    defaultValues: { email: "" },
  });
  const codeForm = useForm<ConfirmInput>({
    resolver: zodResolver(personalEmailConfirmSchema),
    defaultValues: { code: "" },
  });

  async function onRequest(values: RequestInput) {
    setSubmitting(true);
    const result = await requestPersonalEmailCode(values);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPendingEmail(result.data.email);
    codeForm.reset({ code: "" });
    toast.success(`Code sent to ${result.data.email}.`);
  }

  async function onConfirm(values: ConfirmInput) {
    setSubmitting(true);
    const result = await confirmPersonalEmailCode(values);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Personal email verified.");
    onVerified(result.data.email);
  }

  if (pendingEmail) {
    return (
      <form onSubmit={codeForm.handleSubmit(onConfirm)} className="grid gap-4">
        <Controller
          name="code"
          control={codeForm.control}
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className={formFieldStyles.fieldShell}
            >
              <FieldLabel
                htmlFor={field.name}
                className={formFieldStyles.label}
              >
                Verification code
              </FieldLabel>
              <InputOTP
                id={field.name}
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="size-10 text-base"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <FieldDescription>
                Enter the 6-digit code sent to {pendingEmail}.
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Verifying..." : "Confirm code"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={submitting}
          onClick={() => setPendingEmail(null)}
        >
          Use a different email
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={emailForm.handleSubmit(onRequest)} className="grid gap-4">
      <FormField
        control={emailForm.control}
        name="email"
        label="Personal email"
        type="email"
        autoComplete="email"
        description="Your real inbox (e.g. Gmail) — password resets and account emails are delivered here."
      />
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Sending code..." : "Send verification code"}
      </Button>
    </form>
  );
}
