import Link from "next/link";
import {
  DashboardListItem,
  DashboardPanel,
  EmptyState,
} from "@/components/dashboard/widgets";
import { BrandBadge } from "@/components/ui/brand";
import { formatDateTime } from "@/lib/format";
import { EVENT_TYPE_LABELS } from "@/lib/labels";

export function UpcomingEvents({
  items,
}: {
  items: {
    id: string;
    title: string;
    type: string;
    startsAt: Date;
    location: string | null;
  }[];
}) {
  return (
    <DashboardPanel
      title="Upcoming events"
      description={
        <Link href="/dashboard/calendar" className="hover:text-foreground">
          Open calendar →
        </Link>
      }
    >
      <div className="grid gap-3">
        {items.length === 0 ? (
          <EmptyState message="No upcoming events. Scheduled events will appear here." />
        ) : null}
        {items.map((event) => (
          <DashboardListItem
            key={event.id}
            title={event.title}
            description={
              <>
                {formatDateTime(event.startsAt)}
                {event.location ? ` · ${event.location}` : ""}
              </>
            }
            badge={
              <BrandBadge>
                {
                  EVENT_TYPE_LABELS[
                    event.type as keyof typeof EVENT_TYPE_LABELS
                  ]
                }
              </BrandBadge>
            }
          />
        ))}
      </div>
    </DashboardPanel>
  );
}
