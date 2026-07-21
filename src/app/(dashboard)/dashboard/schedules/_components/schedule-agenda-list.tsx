"use client";

import { EVENT_TYPE_LABELS } from "@lib/labels";
import type { EventType } from "@server/db/schema";
import { format, isSameDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const MY_TIME_ZONE = "Asia/Kuala_Lumpur";

type ScheduleEvent = {
  id: string;
  title: string;
  type: EventType;
  date: string;
  location: string | null;
  squadId: string | null;
  squadName: string | null;
  squadAccentColor: string | null;
};

const DEFAULT_ACCENT_COLOR = "var(--primary)";

/** Malaysia wall-clock day for a stored date — grouping/comparisons must
 * use this instead of raw Date getters, which reflect the runtime's own
 * timezone and can disagree with the intended calendar day. */
function myDay(date: string) {
  return toZonedTime(new Date(date), MY_TIME_ZONE);
}

/** Groups events by their calendar day. */
function groupByStartDay(events: ScheduleEvent[]) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const groups: { day: Date; events: ScheduleEvent[] }[] = [];
  for (const event of sorted) {
    const start = myDay(event.date);
    const last = groups.at(-1);
    if (last && isSameDay(last.day, start)) {
      last.events.push(event);
    } else {
      groups.push({ day: start, events: [event] });
    }
  }
  return groups;
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
