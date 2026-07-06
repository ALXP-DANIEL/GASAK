"use client";

import { FormField } from "@components/forms/form-field";
import { Button } from "@components/ui/shadcn/button";
import { forgotPasswordSchema } from "@features/auth/schema";
import type { ForgotPasswordInput } from "@features/auth/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset } from "@server/actions/auth";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setSubmitting(true);
    const result = await requestPasswordReset(values);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-heading text-2xl font-bold">Check your email</h1>
        <p className="text-balance text-sm text-muted-foreground">
          If an account exists for that address, we sent a link to reset your
          password.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-2xl font-bold">Forgot password?</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          placeholder="you@gasak.gg"
          autoComplete="email"
        />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Sending..." : "Send reset link"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="hover:text-foreground">
            Back to sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
