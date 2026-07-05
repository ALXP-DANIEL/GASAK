import { Suspense } from "react";
import { createPageMetadata } from "@/lib/metadata";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = createPageMetadata({
  title: "Reset Password",
  description: "Set a new password for your account.",
  path: "/old/reset-password",
});

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
