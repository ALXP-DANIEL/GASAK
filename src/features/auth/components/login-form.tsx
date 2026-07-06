"use client";

import { FormField } from "@components/forms/form-field";
import { Button } from "@components/ui/shadcn/button";
import { loginSchema } from "@features/auth/schema";
import type { LoginInput } from "@features/auth/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@lib/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function safeCallbackUrl(value: string | null) {
  if (!value) return null;

  const url = new URL(value, window.location.origin);
  if (url.origin !== window.location.origin) return null;

  return `${url.pathname}${url.search}${url.hash}`;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    const callbackUrl =
      safeCallbackUrl(searchParams.get("callbackUrl")) ??
      safeCallbackUrl(searchParams.get("callbackURL")) ??
      safeCallbackUrl(searchParams.get("next")) ??
      "/dashboard";

    const { data, error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: callbackUrl,
    });

    if (error) {
      setSubmitting(false);
      toast.error(error.message ?? "Invalid email or password");
      return;
    }

    router.push(safeCallbackUrl(data?.url ?? null) ?? callbackUrl);
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-2xl font-bold">Welcome back</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Sign in to your GASAK management account
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
        <FormField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          labelAddon={
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          }
        />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
