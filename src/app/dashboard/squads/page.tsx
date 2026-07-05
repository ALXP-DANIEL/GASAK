import { count, eq } from "drizzle-orm";
import Link from "next/link";
import {
  DashboardPanel,
  EmptyState,
  PageHeader,
} from "@/components/dashboard/widgets";
import { BrandBadge } from "@/components/ui/brand";
import { Button } from "@/components/ui/shadcn/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn/tabs";
import { requireRole } from "@/lib/session";
import { db, squadMembers, squads } from "@/server/db";
import { SquadFormDialog } from "./squad-form";

export const dynamic = "force-dynamic";

export default async function SquadsPage() {
  await requireRole("admin");

  const rows = await db
    .select({ squad: squads, memberCount: count(squadMembers.id) })
    .from(squads)
    .leftJoin(squadMembers, eq(squadMembers.squadId, squads.id))
    .groupBy(squads.id)
    .orderBy(squads.createdAt);

  const active = rows.filter((r) => !r.squad.archived);
  const archived = rows.filter((r) => r.squad.archived);

  const renderList = (
    list: typeof rows,
    emptyMessage: string,
  ): React.ReactNode =>
    list.length === 0 ? (
      <EmptyState message={emptyMessage} />
    ) : (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map(({ squad, memberCount }) => (
          <DashboardPanel
            key={squad.id}
            title={squad.name}
            description={
              <p className="line-clamp-2">
                {squad.description || "No description"}
              </p>
            }
            action={
              squad.archived ? (
                <BrandBadge className="border-destructive/50 bg-destructive/10 text-destructive">
                  Archived
                </BrandBadge>
              ) : (
                <BrandBadge>
                  {memberCount} member{memberCount === 1 ? "" : "s"}
                </BrandBadge>
              )
            }
          >
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/squads/${squad.slug}`}>Manage</Link>
            </Button>
          </DashboardPanel>
        ))}
      </div>
    );

  return (
    <div>
      <PageHeader
        title="Squads"
        description="Create, edit, archive, and staff GASAK squads."
      >
        <SquadFormDialog />
      </PageHeader>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archived.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {renderList(active, "No active squads. Create your first squad.")}
        </TabsContent>
        <TabsContent value="archived" className="mt-4">
          {renderList(archived, "No archived squads.")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
