"use client";

import type { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  type DateClickArg,
} from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { formatDateTime } from "@/lib/format";
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "@/lib/labels";
import { createEvent, deleteEvent } from "@/server/actions/events";
import { type EventType, eventTypeEnum } from "@/server/db/schema";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  extendedProps: {
    type: EventType;
    description: string | null;
    location: string | null;
    squadName: string | null;
    canManage: boolean;
  };
};

type SquadOption = { id: string; name: string };

const queryClient = new QueryClient();

export function CalendarView(props: {
  canCreate: boolean;
  allowOrgWide: boolean;
  squads: SquadOption[];
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <CalendarInner {...props} />
    </QueryClientProvider>
  );
}

function CalendarInner({
  canCreate,
  allowOrgWide,
  squads,
}: {
  canCreate: boolean;
  allowOrgWide: boolean;
  squads: SquadOption[];
}) {
  const router = useRouter();
  const client = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [squadId, setSquadId] = useState<string>(
    allowOrgWide ? "org" : (squads[0]?.id ?? ""),
  );
  const [type, setType] = useState<EventType>("practice");

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to load events");
      return res.json();
    },
  });

  function refresh() {
    client.invalidateQueries({ queryKey: ["events"] });
    router.refresh();
  }

  function onDateClick(arg: DateClickArg) {
    if (!canCreate) return;
    setCreateDate(`${arg.dateStr.slice(0, 10)}T20:00`);
    setCreateOpen(true);
  }

  function onEventClick(arg: EventClickArg) {
    const match = events.find((event) => event.id === arg.event.id);
    if (match) setSelected(match);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createEvent({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? "") || undefined,
        type,
        startsAt: String(formData.get("startsAt") ?? ""),
        endsAt: String(formData.get("endsAt") ?? "") || undefined,
        location: String(formData.get("location") ?? "") || undefined,
        squadId: squadId === "org" ? null : squadId,
      });
      if (result.ok) {
        toast.success(result.message);
        setCreateOpen(false);
        refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function onDelete(eventId: string) {
    startTransition(async () => {
      const result = await deleteEvent(eventId);
      if (result.ok) {
        toast.success(result.message);
        setSelected(null);
        refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {eventTypeEnum.enumValues.map((eventType) => (
            <span
              key={eventType}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: EVENT_TYPE_COLORS[eventType] }}
              />
              {EVENT_TYPE_LABELS[eventType]}
            </span>
          ))}
        </div>
        {canCreate && (
          <Button
            size="sm"
            onClick={() => {
              setCreateDate(null);
              setCreateOpen(true);
            }}
          >
            New event
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card p-3 [&_.fc]:font-mono [&_.fc-toolbar-title]:text-lg">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Loading calendar…
          </p>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            events={events.map((event) => ({
              ...event,
              backgroundColor: EVENT_TYPE_COLORS[event.extendedProps.type],
              borderColor: EVENT_TYPE_COLORS[event.extendedProps.type],
            }))}
            dateClick={onDateClick}
            eventClick={onEventClick}
            height="auto"
          />
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New event</DialogTitle>
            <DialogDescription>
              Schedule a practice, scrim, meeting, or tournament.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as EventType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypeEnum.enumValues.map((eventType) => (
                      <SelectItem key={eventType} value={eventType}>
                        {EVENT_TYPE_LABELS[eventType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Squad</Label>
                <Select value={squadId} onValueChange={setSquadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a squad" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowOrgWide && (
                      <SelectItem value="org">All squads (org-wide)</SelectItem>
                    )}
                    {squads.map((squad) => (
                      <SelectItem key={squad.id} value={squad.id}>
                        {squad.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startsAt">Starts</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  required
                  defaultValue={createDate ?? undefined}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endsAt">Ends (optional)</Label>
                <Input id="endsAt" name="endsAt" type="datetime-local" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="Discord, custom lobby, venue…"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create event"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {formatDateTime(selected.start)}
                  {selected.end ? ` — ${formatDateTime(selected.end)}` : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 text-sm">
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {EVENT_TYPE_LABELS[selected.extendedProps.type]}
                  </Badge>
                  <Badge variant="outline">
                    {selected.extendedProps.squadName ?? "All squads"}
                  </Badge>
                </div>
                {selected.extendedProps.location && (
                  <p className="text-muted-foreground">
                    📍 {selected.extendedProps.location}
                  </p>
                )}
                {selected.extendedProps.description && (
                  <p className="text-muted-foreground">
                    {selected.extendedProps.description}
                  </p>
                )}
                {selected.extendedProps.canManage && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-2 w-fit"
                    disabled={pending}
                    onClick={() => onDelete(selected.id)}
                  >
                    {pending ? "Deleting…" : "Delete event"}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
