import {
  DetailRow,
  PageHeader,
} from "@app/(dashboard)/dashboard/_components/page-surface";
import { DeleteButton } from "@components/shared/delete-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { getEvent } from "@features/events/queries";
import { listManagedSquadOptions } from "@features/squads/queries";
import { formatDateTime } from "@lib/format";
import { EVENT_TYPE_LABELS } from "@lib/labels";
import { deleteEvent } from "@server/actions/events";
import { canManageSquad } from "@server/authz";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireDashboardRole } from "../../_components/dashboard-section";
import { EventFormDialog } from "../_components/event-form-dialog";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { user, role } = await requireDashboardRole();
  const { eventId } = await params;
  if (!z.uuid().safeParse(eventId).success) notFound();
  const event = await getEvent(eventId);
  if (!event) notFound();

  const [canManage, squads] = await Promise.all([
    canManageSquad(user.id, role, event.squadId),
    listManagedSquadOptions(role, user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={event.title}
        description="Event details"
        actions={
          canManage ? (
            <>
              <EventFormDialog
                squads={squads}
                allowOrgWide={role === "admin"}
                event={event}
              />
              <DeleteButton
                action={deleteEvent.bind(null, event.id)}
                title="Delete event?"
                description={`This will permanently remove "${event.title}".`}
                redirectTo="/dashboard/schedules"
              />
            </>
          ) : undefined
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <DetailRow label="Type" value={EVENT_TYPE_LABELS[event.type]} />
          <DetailRow
            label="Squad"
            value={event.squad?.name ?? "Organization-wide"}
          />
          <DetailRow label="Starts" value={formatDateTime(event.startsAt)} />
          <DetailRow
            label="Ends"
            value={event.endsAt ? formatDateTime(event.endsAt) : "—"}
          />
          <DetailRow label="Location" value={event.location ?? "—"} />
          {event.description && (
            <DetailRow
              label="Description"
              value={
                <span className="whitespace-pre-wrap">{event.description}</span>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
