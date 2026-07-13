"use client";

import { Button } from "@components/ui/shadcn/button";
import { ButtonGroup } from "@components/ui/shadcn/button-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/shadcn/select";
import {
  type DatesSetInfo,
  type EventHoveringInfo,
  type EventInput,
  useCalendarController,
} from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { useScreen } from "@hooks/use-screen";
import { EVENT_TYPE_LABELS } from "@lib/labels";
import { cn } from "@lib/utils";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import type { EventType } from "@server/db/schema";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EventCalendarViews } from "./event-calendar-views";
import { EventFormDialog } from "./event-form-dialog";
import { ScheduleAgendaList } from "./schedule-agenda-list";

type ScheduleEvent = {
  id: string;
  title: string;
  type: EventType;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  squadId: string | null;
  squadName: string | null;
  squadAccentColor: string | null;
};

type HoverState = {
  top: number;
  left: number;
  event: ScheduleEvent;
};

type SquadOption = {
  value: string;
  label: string;
};

const views = [
  { key: "dayGridMonth", label: "Month" },
  { key: "timeGridWeek", label: "Week" },
  { key: "timeGridDay", label: "Day" },
  { key: "listMonth", label: "Agenda" },
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

/** App-wide gold accent, used when a squad has no custom accent color. */
const DEFAULT_ACCENT_COLOR = "var(--primary)";

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
  const isMobile = useScreen("mobile");
  const [selectedCalendar, setSelectedCalendar] = useState(allCalendarKey);
  const [view, setView] =
    useState<(typeof views)[number]["key"]>("dayGridMonth");
  const [title, setTitle] = useState(format(new Date(), "MMMM yyyy"));
  const [visibleEventCount, setVisibleEventCount] = useState(events.length);
  const [hover, setHover] = useState<HoverState | null>(null);
  const userPickedView = useRef(false);

  // A month grid is unreadable on a phone — default to the agenda list
  // once we know the viewport, unless the user already chose a view.
  useEffect(() => {
    if (isMobile && !userPickedView.current && view === "dayGridMonth") {
      setView("listMonth");
      controller.changeView("listMonth");
    }
  }, [isMobile, view, controller]);

  const eventsById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  );

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

  // The agenda list isn't a FullCalendar view, so it never fires datesSet —
  // keep the count and title in sync with it manually.
  useEffect(() => {
    if (isMobile && view === "listMonth") {
      setTitle("Agenda");
      setVisibleEventCount(filteredEvents.length);
    }
  }, [isMobile, view, filteredEvents]);

  const calendarEvents = useMemo<EventInput[]>(
    () =>
      filteredEvents.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.startsAt,
        end: event.endsAt ?? undefined,
        color: event.squadAccentColor || DEFAULT_ACCENT_COLOR,
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
    userPickedView.current = true;
    setView(nextView);
    controller.changeView(nextView);
  }

  function handleEventMouseEnter(info: EventHoveringInfo) {
    const event = eventsById.get(info.event.id);
    if (!event) return;
    const rect = info.el.getBoundingClientRect();
    setHover({ top: rect.bottom + 8, left: rect.left, event });
  }

  function handleEventMouseLeave() {
    setHover(null);
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
          <Select
            value={selectedCalendar}
            onValueChange={(value) =>
              setSelectedCalendar(value ?? allCalendarKey)
            }
          >
            <SelectTrigger
              aria-label="Calendar filter"
              className="w-full desktop:w-48"
            >
              <CalendarBlankIcon />
              <SelectValue>
                {(value: string) => calendarLabel(value, calendars)}
              </SelectValue>
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
            <SelectTrigger aria-label="Calendar view" className="w-28">
              <SelectValue>
                {(value: string) =>
                  views.find((item) => item.key === value)?.label ?? value
                }
              </SelectValue>
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
            <EventFormDialog
              squads={squads}
              allowOrgWide={allowOrgWide}
              trigger={
                <Button>
                  <PlusIcon />
                  Add event
                </Button>
              }
            />
          )}
        </div>
      </div>

      <div className="calendar-shell relative bg-background">
        {isMobile && view === "listMonth" ? (
          <ScheduleAgendaList events={filteredEvents} />
        ) : (
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
              setHover(null);
              router.push(`/dashboard/schedules/${info.event.id}`);
            }}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            eventClass={(info) =>
              cn(
                "cursor-pointer",
                info.isSelected
                  ? ["outline-3", info.isDragging && "shadow-lg"]
                  : "focus-visible:outline-3",
                "outline-ring/50",
              )
            }
          />
        )}

        {hover && !isMobile && (
          <div
            className="fixed z-50 w-64 rounded-md border bg-popover p-3 text-popover-foreground shadow-lg"
            style={{ top: hover.top, left: hover.left }}
          >
            <span className="truncate font-medium text-sm">
              {hover.event.title}
            </span>
            <div className="mt-1.5 grid gap-0.5 text-xs text-muted-foreground">
              <span>{EVENT_TYPE_LABELS[hover.event.type]}</span>
              <span>
                {format(new Date(hover.event.startsAt), "MMM d, h:mm a")}
                {hover.event.endsAt &&
                  ` – ${format(new Date(hover.event.endsAt), "h:mm a")}`}
              </span>
              {hover.event.location && <span>{hover.event.location}</span>}
              <span>{hover.event.squadName ?? "Organization-wide"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
