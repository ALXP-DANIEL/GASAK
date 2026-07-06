"use client";

import {
  type DatesSetInfo,
  type EventInput,
  useCalendarController,
} from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { Button } from "@/components/ui/shadcn/button";
import { ButtonGroup } from "@/components/ui/shadcn/button-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { EVENT_TYPE_COLORS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { deleteEvent } from "@/server/actions/events";
import type { EventType } from "@/server/db/schema";
import { EventForm } from "./event-form";

type ScheduleEvent = {
  id: string;
  title: string;
  type: EventType;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  squadId: string | null;
  squadName: string | null;
};

type SquadOption = {
  value: string;
  label: string;
};

const views = [
  { key: "dayGridMonth", label: "Month" },
  { key: "timeGridWeek", label: "Week" },
  { key: "timeGridDay", label: "Day" },
] as const;

const plugins = [
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
  multiMonthPlugin,
];

const allCalendarKey = "all";
const orgCalendarKey = "org";

function eventCountInRange(events: ScheduleEvent[], start: Date, end: Date) {
  return events.filter((event) => {
    const date = new Date(event.startsAt);
    return date >= start && date < end;
  }).length;
}

function calendarLabel(value: string, calendars: SquadOption[]) {
  return calendars.find((calendar) => calendar.value === value)?.label ?? "All";
}

export function ScheduleCalendar({
  events,
  squads,
  canManage,
  allowOrgWide,
}: {
  events: ScheduleEvent[];
  squads: SquadOption[];
  canManage: boolean;
  allowOrgWide: boolean;
}) {
  const controller = useCalendarController();
  const router = useRouter();
  const [selectedCalendar, setSelectedCalendar] = useState(allCalendarKey);
  const [view, setView] =
    useState<(typeof views)[number]["key"]>("dayGridMonth");
  const [title, setTitle] = useState(format(new Date(), "MMMM yyyy"));
  const [visibleEventCount, setVisibleEventCount] = useState(events.length);
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const calendars = useMemo(
    () => [
      { value: allCalendarKey, label: "All calendars" },
      { value: orgCalendarKey, label: "Organization-wide" },
      ...squads,
    ],
    [squads],
  );

  const filteredEvents = useMemo(() => {
    if (selectedCalendar === allCalendarKey) return events;
    if (selectedCalendar === orgCalendarKey) {
      return events.filter((event) => event.squadId === null);
    }
    return events.filter((event) => event.squadId === selectedCalendar);
  }, [events, selectedCalendar]);

  const calendarEvents = useMemo<EventInput[]>(
    () =>
      filteredEvents.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.startsAt,
        end: event.endsAt ?? undefined,
        color: EVENT_TYPE_COLORS[event.type],
        extendedProps: {
          eventType: event.type,
          location: event.location,
          squadName: event.squadName,
        },
      })),
    [filteredEvents],
  );

  function handleDatesSet(info: DatesSetInfo) {
    setTitle(info.view.title);
    setVisibleEventCount(
      eventCountInRange(filteredEvents, info.start, info.end),
    );
  }

  function changeView(nextView: (typeof views)[number]["key"]) {
    setView(nextView);
    controller.changeView(nextView);
  }

  function removeEvent(eventId: string) {
    startTransition(async () => {
      const result = await deleteEvent(eventId);
      if (!result.ok) {
        toast.error(result.error ?? "Could not delete event");
        return;
      }

      toast.success(result.message ?? "Event deleted");
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden border bg-card shadow-xs">
      <div className="flex flex-col gap-4 border-b bg-sidebar p-4 text-sidebar-foreground desktop:flex-row desktop:items-center desktop:justify-between">
        <div className="flex min-w-0 shrink-0 flex-col gap-1">
          <div className="text-lg font-medium leading-none">{title}</div>
          <p className="text-sm text-muted-foreground">
            {calendarLabel(selectedCalendar, calendars)} · {visibleEventCount}{" "}
            events
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
            <SelectTrigger className="w-full desktop:w-48">
              <CalendarBlankIcon />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {calendars.map((calendar) => (
                  <SelectItem key={calendar.value} value={calendar.value}>
                    {calendar.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <ButtonGroup>
            <Button
              size="icon"
              variant="outline"
              onClick={() => controller.prev()}
              aria-label="Previous"
            >
              <CaretLeftIcon />
            </Button>
            <Button variant="outline" onClick={() => controller.today()}>
              Today
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => controller.next()}
              aria-label="Next"
            >
              <CaretRightIcon />
            </Button>
          </ButtonGroup>

          <Select
            value={view}
            onValueChange={(value) => changeView(value as typeof view)}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                {views.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {canManage && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon />
                  Add event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85dvh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New event</DialogTitle>
                  <DialogDescription>
                    Schedule practice, scrims, meetings, or tournaments.
                  </DialogDescription>
                </DialogHeader>
                <EventForm
                  squads={squads}
                  allowOrgWide={allowOrgWide}
                  onSuccess={() => setCreateOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="calendar-shell bg-background">
        <EventCalendarViews
          controller={controller}
          plugins={[...plugins]}
          initialView={view}
          headerToolbar={false}
          events={calendarEvents}
          height="auto"
          nowIndicator
          dayMaxEvents={3}
          popoverCloseContent={() => (
            <XIcon className="size-5 text-muted-foreground group-hover:text-foreground" />
          )}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          datesSet={handleDatesSet}
          eventClick={(info) => {
            if (!canManage) return;
            const ok = window.confirm(`Delete "${info.event.title}"?`);
            if (ok) removeEvent(info.event.id);
          }}
          eventClass={(info) =>
            cn(
              canManage && "cursor-pointer",
              info.isSelected
                ? ["outline-3", info.isDragging && "shadow-lg"]
                : "focus-visible:outline-3",
              "outline-ring/50",
              isPending && "pointer-events-none opacity-70",
            )
          }
        />
      </div>
    </div>
  );
}
