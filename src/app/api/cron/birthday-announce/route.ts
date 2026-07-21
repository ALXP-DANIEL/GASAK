import { env } from "@/env";
import { formatMY } from "@lib/format";
import { db, playerProfiles } from "@server/db";
import { notifyDiscordBirthday } from "@server/discord";
import { notifyWhatsappBirthday } from "@server/whatsapp";
import { isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Runs once a day (see vercel.json). Posts a single batched Discord message
 * for every player whose birthday is today, instead of one message per
 * player, so the channel doesn't get spammed on a day with several birthdays.
 */
export async function GET(request: Request) {
  if (env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const todayMonthDay = formatMY(new Date(), "MM-dd");

  const profiles = await db.query.playerProfiles.findMany({
    where: isNotNull(playerProfiles.dob),
    with: { user: true },
  });

  const birthdays = profiles.filter(
    (profile) => profile.dob?.slice(5) === todayMonthDay,
  );

  if (birthdays.length > 0) {
    const rawNames = birthdays.map(
      (profile) => profile.ign || profile.fullName || profile.user.name,
    );
    await Promise.all([
      notifyDiscordBirthday(
        `🎂 Happy birthday to ${rawNames.map((n) => `**${n}**`).join(", ")}!`,
      ),
      notifyWhatsappBirthday(`🎂 Happy birthday to ${rawNames.join(", ")}!`),
    ]);
  }

  return NextResponse.json({ notified: birthdays.length });
}
