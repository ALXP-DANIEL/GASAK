import { Suspense } from "react";
import { createPageMetadata } from "@/lib/metadata";
import { LoginForm } from "./login-form";

export const metadata = createPageMetadata({
  title: "Login",
  description: "Sign in to the GASAK management system.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
