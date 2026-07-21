import { getWhatsappSettings } from "@server/actions/whatsapp-settings";

/**
 * Fire-and-forget WhatsApp Cloud API send. Failures are logged, not thrown —
 * a WhatsApp outage must never block the recruitment/schedule flow it's
 * reporting on.
 *
 * Unlike Discord, WhatsApp has no "channel" to post into — the Cloud API
 * only sends direct messages to individual numbers, so `recipients` is a
 * comma-separated list of E.164 numbers and we'd fan out one call per number.
 *
 * DISABLED FOR NOW: no Meta Business API token set up yet. The recipient
 * settings (table + admin UI) are live so the lists can be configured ahead
 * of time — only the actual send is commented out. To activate: uncomment
 * the fetch below, add WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID back
 * to src/env.ts, and register a message template in Meta Business Manager
 * (freeform `type: "text"` only works within 24h of the recipient last
 * messaging your business number — swap for a `template` payload otherwise).
 */
async function postToWhatsapp(
  recipients: string | null | undefined,
  content: string,
) {
  const numbers = (recipients ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
  if (numbers.length === 0) return;

  console.log(
    `[whatsapp:disabled] would send to ${numbers.join(", ")}: ${content}`,
  );

  // await Promise.all(
  //   numbers.map(async (to) => {
  //     try {
  //       await fetch(
  //         `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //             Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
  //           },
  //           body: JSON.stringify({
  //             messaging_product: "whatsapp",
  //             to,
  //             type: "text",
  //             text: { body: content },
  //           }),
  //         },
  //       );
  //     } catch (error) {
  //       console.error(`WhatsApp message to ${to} failed`, error);
  //     }
  //   }),
  // );
}

/** Instant ping — one message per new recruitment application. */
export async function notifyWhatsapp(content: string): Promise<void> {
  const settings = await getWhatsappSettings();
  return postToWhatsapp(settings?.recruitmentRecipients, content);
}

/** Batched digest — one message per day, not one per event. */
export async function notifyWhatsappSchedule(content: string): Promise<void> {
  const settings = await getWhatsappSettings();
  return postToWhatsapp(
    settings?.scheduleRecipients ?? settings?.recruitmentRecipients,
    content,
  );
}

/** Batched digest — one message per day, not one per birthday. */
export async function notifyWhatsappBirthday(content: string): Promise<void> {
  const settings = await getWhatsappSettings();
  return postToWhatsapp(
    settings?.birthdayRecipients ?? settings?.recruitmentRecipients,
    content,
  );
}
