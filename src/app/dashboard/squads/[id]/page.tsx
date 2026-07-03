import { eq, notInArray } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/widgets";
import { SquadAccent } from "@/components/squad-accent";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { requireRole } from "@/lib/session";
import { db, squads, user } from "@/server/db";
import { SquadEditForm } from "../squad-form";
import { ArchiveToggle } from "./archive-toggle";
import { MembersManager } from "./members-manager";

export const dynamic = "force-dynamic";

export default async function SquadManagePage(
  props: PageProps<"/dashboard/squads/[id]">,
) {
  await requireRole("admin");
  const { id } = await props.params;

  const squad = await db.query.squads.findFirst({
    where: eq(squads.id, id),
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
        <Badge variant="destructive" className="mb-4">
          This squad is archived and hidden from the public site.
        </Badge>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Squad details</CardTitle>
            <CardDescription>
              Name, description, logo and banner.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
          </CardContent>
        </Card>

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
