import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { DashboardPanel, PageHeader } from "@/components/dashboard/widgets";
import { requireRole } from "@/lib/session";
import { db, user } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function EditPlayerPage(
  props: PageProps<"/old/dashboard/players/[id]">,
) {
  await requireRole("admin");
  const { id } = await props.params;

  const target = await db.query.user.findFirst({
    where: eq(user.id, id),
    with: { profile: true },
  });
  if (!target) notFound();

  return (
    <div>
      <PageHeader
        title={`Edit player — ${target.name}`}
        description={target.email}
      />
      <DashboardPanel title="Player details" className="max-w-3xl">
        <ProfileForm
          targetUserId={target.id}
          displayName={target.name}
          avatarUrl={target.image ?? null}
          profile={target.profile ?? null}
        />
      </DashboardPanel>
    </div>
  );
}
