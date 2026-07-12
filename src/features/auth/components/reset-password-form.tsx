"use client";

import { FormField } from "@components/forms/form-field";
import { Button } from "@components/ui/shadcn/button";
import { resetPasswordSchema } from "@features/auth/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@server/actions/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

const resetPasswordFormSchema = resetPasswordSchema.omit({ token: true });

type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "" },
  });

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-heading text-2xl font-bold">Invalid reset link</h1>
        <p className="text-balance text-sm text-muted-foreground">
          This password reset link is missing or expired. Request a new one to
          continue.
        </p>
        <Button
          className="w-full"
          render={<Link href="/forgot-password">Request new link</Link>}
        />
      </div>
    );
  }

  async function onSubmit(values: ResetPasswordFormInput) {
    if (!token) return;
    setSubmitting(true);
    const result = await resetPassword({ token, password: values.password });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Password updated. Sign in with your new password.");
    router.push("/login");
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-2xl font-bold">Reset password</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Choose a new password for your account
        </p>
      </div>
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          description="Must be at least 8 characters."
        />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Updating..." : "Update password"}
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
