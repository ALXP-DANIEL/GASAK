import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
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
          <Card key={squad.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{squad.name}</CardTitle>
                {squad.archived ? (
                  <Badge variant="destructive">Archived</Badge>
                ) : (
                  <Badge variant="secondary">
                    {memberCount} member{memberCount === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {squad.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/squads/${squad.id}`}>Manage</Link>
              </Button>
            </CardContent>
          </Card>
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
