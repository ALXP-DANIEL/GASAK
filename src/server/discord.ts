import { env } from "@/env";
import { getDiscordSettings } from "@server/actions/discord-settings";

/**
 * Fire-and-forget Discord bot message post. Failures are logged, not thrown —
 * a Discord outage must never block the recruitment/schedule flow it's
 * reporting on.
 */
async function postToDiscord(
  channelId: string | null | undefined,
  content: string,
) {
  if (!env.DISCORD_BOT_TOKEN || !channelId) return;

  try {
    await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
        },
        body: JSON.stringify({ content }),
      },
    );
  } catch (error) {
    console.error("Discord bot message failed", error);
  }
}

/** Instant ping — one message per new recruitment application. */
export async function notifyDiscord(content: string): Promise<void> {
  const settings = await getDiscordSettings();
  return postToDiscord(settings?.recruitmentChannelId, content);
}

/** Batched digest — one message per day, not one per event. */
export async function notifyDiscordSchedule(content: string): Promise<void> {
  const settings = await getDiscordSettings();
  return postToDiscord(
    settings?.scheduleChannelId ?? settings?.recruitmentChannelId,
    content,
  );
}

/** Batched digest — one message per day, not one per birthday. */
export async function notifyDiscordBirthday(content: string): Promise<void> {
  const settings = await getDiscordSettings();
  return postToDiscord(
    settings?.birthdayChannelId ?? settings?.recruitmentChannelId,
    content,
  );
}
