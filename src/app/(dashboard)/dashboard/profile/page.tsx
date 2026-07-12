import {
  DetailRow,
  PageHeader,
} from "@app/(dashboard)/dashboard/_components/page-surface";
import { ProfileHeroCard } from "@components/cards/player/profile-hero-card";
import { Icons } from "@components/icons";
import { SplitView } from "@components/shared/split-view";
import { Badge } from "@components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { getPlayer } from "@features/players/queries";
import { ROLE_LABELS, SQUAD_ROLE_LABELS } from "@lib/labels";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardRole } from "../_components/dashboard-section";
import { ProfileEditDialog } from "../settings/_components/profile-edit-dialog";
import { buildProfileFormDefaults } from "../settings/_components/profile-form-schema";

export default async function ProfilePage() {
  const { user, role } = await requireDashboardRole();
  const player = await getPlayer(user.id);
  if (!player) notFound();

  const profile = player.profile;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profile"
        kicker="Account"
        icon={Icons.Stats.Players}
        description="Your player card as it appears across the dashboard."
        actions={
          <>
            <Badge variant="outline">{ROLE_LABELS[role]}</Badge>
            <ProfileEditDialog
              userId={user.id}
              imageUrl={user.image}
              defaultValues={buildProfileFormDefaults(user.name, profile)}
            />
          </>
        }
      />
      <SplitView
        className="gap-4"
        aside={
          <>
            <Card>
              <CardHeader>
                <CardTitle>Player details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailRow label="Role" value={ROLE_LABELS[role]} />
                <DetailRow label="Full Name" value={profile?.fullName ?? "—"} />
                <DetailRow label="Email" value={player.email} />
                <DetailRow label="Phone" value={profile?.phone ?? "—"} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Squads
                </p>
                {player.memberships.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Not in any squad yet.
                  </p>
                )}
                {player.memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <Link
                      href={`/dashboard/squads/${membership.squadId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {membership.squad.name}
                    </Link>
                    <Badge variant="outline">
                      {SQUAD_ROLE_LABELS[membership.squadRole]}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        }
      >
        <ProfileHeroCard
          name={player.name}
          image={player.image}
          profile={profile}
          className="h-fit"
        />
      </SplitView>
    </div>
  );
}
