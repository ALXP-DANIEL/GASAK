"use client";

import { EVENT_TYPE_LABELS } from "@lib/labels";
import type { EventType } from "@server/db/schema";
import { format, isSameDay } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { formatTime } from "@/lib/format";

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

const DEFAULT_ACCENT_COLOR = "var(--primary)";

/** Groups events by the calendar day they start on, so a multi-day event
 * (e.g. 4pm–5am) appears once under its start day instead of once per day
 * it overlaps — the header/time text carries the range instead. */
function groupByStartDay(events: ScheduleEvent[]) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const groups: { day: Date; events: ScheduleEvent[] }[] = [];
  for (const event of sorted) {
    const start = new Date(event.startsAt);
    const last = groups.at(-1);
    if (last && isSameDay(last.day, start)) {
      last.events.push(event);
    } else {
      groups.push({ day: start, events: [event] });
    }
  }
  return groups;
}

function eventTimeLabel(event: ScheduleEvent) {
  const start = new Date(event.startsAt);
  if (!event.endsAt) return formatTime(start);
  const end = new Date(event.endsAt);
  const startTime = formatTime(start);
  const endTime = formatTime(end);
  if (isSameDay(start, end)) return `${startTime} – ${endTime}`;
  return `${startTime} – ${endTime}, ${format(end, "MMM d")}`;
}

export function ScheduleAgendaList({ events }: { events: ScheduleEvent[] }) {
  const router = useRouter();
  const groups = useMemo(() => groupByStartDay(events), [events]);

  if (groups.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No events to show.
      </div>
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <div key={group.day.toISOString()}>
          <div className="flex items-baseline justify-between border-b bg-sidebar px-4 py-3 text-sidebar-foreground">
            <span className="font-bold">
              {format(group.day, "MMMM d, yyyy")}
            </span>
            <span className="text-muted-foreground">
              {format(group.day, "EEEE")}
            </span>
          </div>

          {group.events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => router.push(`/dashboard/schedules/${event.id}`)}
              className="flex w-full items-center gap-3 border-b px-4 py-3 text-left hover:bg-accent/50"
            >
              <span className="w-28 shrink-0 text-muted-foreground text-sm">
                {eventTimeLabel(event)}
              </span>
              <span
                className="h-6 w-1 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    event.squadAccentColor || DEFAULT_ACCENT_COLOR,
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {event.title}
                </span>
                <span className="block truncate text-muted-foreground text-xs">
                  {EVENT_TYPE_LABELS[event.type]}
                  {event.squadName ? ` · ${event.squadName}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
