import {
  DetailRow,
  PageHeader,
} from "@app/(dashboard)/dashboard/_components/page-surface";
import { Icons } from "@components/icons";
import { Badge } from "@components/ui/shadcn/badge";
import { buttonVariants } from "@components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { ROLE_LABELS } from "@lib/labels";
import { cn } from "@lib/utils";
import Link from "next/link";
import { requireDashboardRole } from "../_components/dashboard-section";
import { ChangePasswordCard } from "./_components/change-password-card";

export default async function SettingsPage() {
  const { user, role } = await requireDashboardRole();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        kicker="Account"
        icon={Icons.Actions.Settings}
        description="Manage your account and app preferences."
        actions={<Badge variant="outline">{ROLE_LABELS[role]}</Badge>}
      />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>
            Your account details as registered with GASAK.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <DetailRow label="Name" value={user.name} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Role" value={ROLE_LABELS[role]} />
          <Link
            href="/dashboard/profile"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-fit",
            )}
          >
            <Icons.Stats.Players />
            View & edit player profile
          </Link>
        </CardContent>
      </Card>
      <ChangePasswordCard />
    </div>
  );
}
