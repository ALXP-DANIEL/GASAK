import { ChangePasswordForm } from "@features/auth/components/change-password-form";
import { requireUser } from "@server/session";

export default async function ChangePasswordPage() {
  await requireUser();

  return <ChangePasswordForm />;
}
