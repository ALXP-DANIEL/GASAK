"use client";

import { FormField } from "@components/forms/form-field";
import { FormSection } from "@components/forms/form-section";
import { Button } from "@components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { changePasswordSchema } from "@features/auth/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePassword } from "@server/actions/auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export function ChangePasswordCard() {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  async function onSubmit(values: ChangePasswordInput) {
    setSubmitting(true);
    const result = await changePassword(values);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Password updated");
    form.reset();
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="text-base">Password</CardTitle>
        <CardDescription>Update the password for this account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <FormSection title="Change Password">
            <FormField
              control={form.control}
              name="currentPassword"
              label="Current password"
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
          </FormSection>
          <Button type="submit" disabled={submitting} className="w-fit">
            {submitting ? "Updating..." : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
