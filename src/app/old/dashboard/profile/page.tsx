import { eq } from "drizzle-orm";
import { ProfileForm } from "@/components/old/dashboard/profile-form";
import { DashboardPanel, PageHeader } from "@/components/old/dashboard/widgets";
import { requireUser } from "@/lib/session";
import { db, playerProfiles, user } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const sessionUser = await requireUser();

  const [account, profile] = await Promise.all([
    db.query.user.findFirst({ where: eq(user.id, sessionUser.id) }),
    db.query.playerProfiles.findFirst({
      where: eq(playerProfiles.userId, sessionUser.id),
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Your player identity — shown on the public site and to your squad."
      />
      <DashboardPanel title="Profile details" className="max-w-3xl">
        <ProfileForm
          targetUserId={sessionUser.id}
          displayName={account?.name ?? sessionUser.name}
          avatarUrl={account?.image ?? null}
          profile={profile ?? null}
        />
      </DashboardPanel>
    </div>
  );
}
