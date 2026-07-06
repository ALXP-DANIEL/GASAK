import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { Badge } from "@components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/shadcn/table";
import { SquadForm } from "@features/squads/components/squad-form";
import { listSquads } from "@features/squads/queries";
import { formatDate } from "@lib/format";
import Link from "next/link";
import { requireDashboardRole } from "../_components/dashboard-section";

export const dynamic = "force-dynamic";

export default async function SquadsPage() {
  await requireDashboardRole("admin");
  const rows = await listSquads();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Squads"
        description="Rosters across the organization."
      />
      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No squads yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ squad, memberCount }) => (
                  <TableRow key={squad.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/squads/${squad.id}`}
                        className="font-medium hover:underline"
                      >
                        {squad.name}
                      </Link>
                    </TableCell>
                    <TableCell>{memberCount}</TableCell>
                    <TableCell>{formatDate(squad.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={squad.archived ? "outline" : "secondary"}>
                        {squad.archived ? "Archived" : "Active"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Squad</CardTitle>
          <CardDescription>
            Add a new squad to the organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SquadForm />
        </CardContent>
      </Card>
    </div>
  );
}
