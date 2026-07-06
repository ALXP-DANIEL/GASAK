import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { Badge } from "@components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { ROLE_LABELS } from "@lib/labels";
import { db, playerProfiles } from "@server/db";
import { eq } from "drizzle-orm";
import { requireDashboardRole } from "../_components/dashboard-section";
import { ProfileForm } from "./_components/profile-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { user, role } = await requireDashboardRole();
  const profile = await db.query.playerProfiles.findFirst({
    where: eq(playerProfiles.userId, user.id),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your account and player profile."
        actions={<Badge variant="outline">{ROLE_LABELS[role]}</Badge>}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            Your display name and player details. Email: {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            userId={user.id}
            imageUrl={user.image}
            defaultValues={{
              name: user.name ?? "",
              fullName: profile?.fullName ?? "",
              nickname: profile?.nickname ?? "",
              ign: profile?.ign ?? "",
              mlbbId: profile?.mlbbId ?? "",
              serverId: profile?.serverId ?? "",
              phone: profile?.phone ?? "",
              preferredLane: profile?.preferredLane ?? "",
              currentRank: profile?.currentRank ?? "",
              peakRank: profile?.peakRank ?? "",
              avatar: null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
