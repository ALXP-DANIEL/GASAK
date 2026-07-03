import { requireUser, userRole } from "@/lib/session";
import { DashboardShell } from "./shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, role: userRole(user) }}
    >
      {children}
    </DashboardShell>
  );
}
