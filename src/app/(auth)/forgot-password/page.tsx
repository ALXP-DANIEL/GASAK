import { createPageMetadata } from "@/lib/metadata";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = createPageMetadata({
  title: "Forgot Password",
  description: "Request a password reset link.",
  path: "/forgot-password",
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
