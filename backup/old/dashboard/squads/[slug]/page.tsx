import { eq, notInArray } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import { DashboardPanel, PageHeader } from "@/components/old/dashboard/widgets";
import { SquadAccent } from "@/components/accent";
import { BrandBadge } from "@/components/ui/brand";
import { requireRole } from "@/lib/session";
import { db, squads, user } from "@/server/db";
import { SquadEditForm } from "../squad-form";
import { ArchiveToggle } from "./archive-toggle";
import { MembersManager } from "./members-manager";

export const dynamic = "force-dynamic";

export default async function SquadManagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireRole("admin");
  const { slug } = await params;

  const squad = await db.query.squads.findFirst({
    where: eq(squads.slug, slug),
    with: {
      members: { with: { user: { with: { profile: true } } } },
    },
  });
  if (!squad) notFound();

  const memberIds = squad.members.map((m) => m.userId);
  const candidates = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(memberIds.length ? notInArray(user.id, memberIds) : undefined)
    .orderBy(user.name);

  return (
    <SquadAccent color={squad.accentColor}>
      <PageHeader
        title={squad.name}
        description={`/${squad.slug} — manage details and roster.`}
      >
        <ArchiveToggle squadId={squad.id} archived={squad.archived} />
      </PageHeader>

      {squad.archived && (
        <BrandBadge className="mb-4 border-destructive/50 bg-destructive/10 text-destructive">
          This squad is archived and hidden from the public site.
        </BrandBadge>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel
          title="Squad details"
          description="Name, description, logo and banner."
        >
          <div className="grid gap-4">
            {(squad.logoUrl || squad.bannerUrl) && (
              <div className="flex items-center gap-4">
                {squad.logoUrl && (
                  <Image
                    src={squad.logoUrl}
                    alt="Logo"
                    width={56}
                    height={56}
                    className="rounded-full border object-cover"
                    unoptimized
                  />
                )}
                {squad.bannerUrl && (
                  <div className="relative h-14 flex-1 overflow-hidden rounded-lg border">
                    <Image
                      src={squad.bannerUrl}
                      alt="Banner"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            )}
            <SquadEditForm squad={squad} />
          </div>
        </DashboardPanel>

        <MembersManager
          squadId={squad.id}
          members={squad.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            squadRole: m.squadRole,
            name: m.user.name,
            ign: m.user.profile?.ign ?? null,
          }))}
          candidates={candidates.map((c) => ({
            id: c.id,
            label: `${c.name} (${c.email})`,
          }))}
        />
      </div>
    </SquadAccent>
  );
}
