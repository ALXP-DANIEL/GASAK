import { env } from "@/env";
import { formatDate } from "@lib/format";
import { EVENT_TYPE_LABELS } from "@lib/labels";
import { db, events } from "@server/db";
import { notifyDiscordSchedule } from "@server/discord";
import { notifyWhatsappSchedule } from "@server/whatsapp";
import { gte } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Runs once a day at 15:00 Malaysia time (see vercel.json). Posts a single
 * batched digest of schedule entries added since the last run instead of
 * pinging Discord per event, so a busy admin adding a week's practices
 * doesn't spam the channel.
 */
export async function GET(request: Request) {
  if (env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newEvents = await db.query.events.findMany({
    where: gte(events.createdAt, since),
    with: { squad: true },
    orderBy: events.date,
  });

  if (newEvents.length > 0) {
    const eventLine = (event: (typeof newEvents)[number]) =>
      `${event.title} (${EVENT_TYPE_LABELS[event.type]}) — ${formatDate(event.date)}${event.squad ? ` · ${event.squad.name}` : ""}`;
    const header = `🗓️ ${newEvents.length} new schedule ${newEvents.length === 1 ? "entry" : "entries"} added today:`;

    await Promise.all([
      notifyDiscordSchedule(
        `${header}\n${newEvents.map((event) => `• **${eventLine(event)}**`).join("\n")}`,
      ),
      notifyWhatsappSchedule(
        `${header}\n${newEvents.map((event) => `• ${eventLine(event)}`).join("\n")}`,
      ),
    ]);
  }

  return NextResponse.json({ notified: newEvents.length });
}
