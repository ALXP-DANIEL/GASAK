"use client";

import { FormField } from "@components/forms/form-field";
import { Button } from "@components/ui/shadcn/button";
import { changePasswordSchema } from "@features/auth/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePassword } from "@server/actions/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

type ChangePasswordFormInput = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  async function onSubmit(values: ChangePasswordFormInput) {
    setSubmitting(true);
    const result = await changePassword(values);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Password updated.");
    router.push("/dashboard");
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-2xl font-bold">Set a new password</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Your account was just created with a temporary password. Choose a new
          one to continue.
        </p>
      </div>
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="currentPassword"
          label="Temporary password"
          type="password"
          autoComplete="current-password"
        />
        <FormField
          control={form.control}
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          description="Must be at least 8 characters."
        />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Updating..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}
