import {
  DetailRow,
  PageHeader,
} from "@app/(dashboard)/dashboard/_components/page-surface";
import { Icons } from "@components/icons";
import { DeleteButton } from "@components/shared/delete-button";
import { PageSkeleton } from "@components/shared/page-skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { getEvent } from "@features/events/queries";
import { listManagedSquadOptions } from "@features/squads/queries";
import { listTournaments } from "@features/tournaments/queries";
import { formatDate, formatMY } from "@lib/format";
import { EVENT_TYPE_LABELS, MATCH_OUTCOME_LABELS } from "@lib/labels";
import { deleteEvent } from "@server/actions/events";
import { canManageSquad, getManagedSquadIds } from "@server/authz";
import { db, scrims, tournamentRounds } from "@server/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireDashboardRole } from "../../_components/dashboard-section";
import { EventFormDialog } from "../_components/event-form-dialog";
import { LogResultDialog } from "../_components/log-result-dialog";

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

  const [canManage, squads, linkedScrim, linkedRound] = await Promise.all([
    canManageSquad(user.id, role, event.squadId),
    listManagedSquadOptions(role, user.id),
    db.query.scrims.findFirst({ where: eq(scrims.eventId, eventId) }),
    db.query.tournamentRounds.findFirst({
      where: eq(tournamentRounds.eventId, eventId),
      with: { tournament: true },
    }),
  ]);

  const hasResult = Boolean(linkedScrim || linkedRound);
  const isPast = event.date < formatMY(new Date(), "yyyy-MM-dd");
  const isMatchType = event.type === "scrim" || event.type === "tournament";
  const showLogResult = canManage && isPast && isMatchType && !hasResult;

  let tournamentOptions: { value: string; label: string }[] = [];
  if (showLogResult) {
    const managedSquadIds =
      role === "admin" ? undefined : await getManagedSquadIds(user.id);
    const rows = await listTournaments(
      event.squadId ? [event.squadId] : managedSquadIds,
    );
    tournamentOptions = rows.map((tournament) => ({
      value: tournament.id,
      label: tournament.name,
    }));
  }

  return (
    <PageSkeleton name="schedules-detail" loading={false}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={event.title}
          breadcrumbLabel={event.title}
          kicker="Schedules"
          icon={Icons.Domain.Calendar}
          description="Event details"
          actions={
            canManage ? (
              <>
                {showLogResult && (
                  <LogResultDialog
                    event={{
                      id: event.id,
                      title: event.title,
                      type: event.type,
                      date: event.date,
                      squadId: event.squadId,
                    }}
                    squads={squads}
                    tournaments={tournamentOptions}
                  />
                )}
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
            <DetailRow label="Date" value={formatDate(event.date)} />
            {event.type === "tournament" && (
              <DetailRow
                label="Prize Pool"
                value={event.prizePool ?? "—"}
              />
            )}
            <DetailRow label="Location" value={event.location ?? "—"} />
            {event.description && (
              <DetailRow
                label="Description"
                value={
                  <span className="whitespace-pre-wrap">
                    {event.description}
                  </span>
                }
              />
            )}
            {linkedScrim && (
              <DetailRow
                label="Result"
                value={
                  <Link
                    href={`/dashboard/matches/${linkedScrim.id}`}
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    vs {linkedScrim.opponent}
                    {linkedScrim.result ? ` — ${linkedScrim.result}` : ""}
                  </Link>
                }
              />
            )}
            {linkedRound && (
              <DetailRow
                label="Result"
                value={
                  <Link
                    href={`/dashboard/tournaments/${linkedRound.tournamentId}`}
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {linkedRound.tournament.name} · {linkedRound.roundLabel} vs{" "}
                    {linkedRound.opponent} —{" "}
                    {MATCH_OUTCOME_LABELS[linkedRound.outcome]}
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PageSkeleton>
  );
}
