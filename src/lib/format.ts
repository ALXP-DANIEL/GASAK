import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const MY_TIME_ZONE = "Asia/Kuala_Lumpur";

export function formatRM(sen: number) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(sen / 100);
}

/**
 * All display helpers below render in Malaysia time explicitly, not the
 * runtime's local timezone — this must stay symmetric with
 * parseMYDateTimeLocal below, otherwise a server render (UTC on Vercel) and
 * a browser in a different timezone can show different calendar days for
 * the same stored instant.
 */
export function formatDate(date: Date | string) {
  return formatInTimeZone(new Date(date), MY_TIME_ZONE, "d MMM yyyy");
}

export function formatDateTime(date: Date | string) {
  return formatInTimeZone(new Date(date), MY_TIME_ZONE, "d MMM yyyy, h:mm a");
}

export function formatTime(date: Date | string) {
  return formatInTimeZone(new Date(date), MY_TIME_ZONE, "h:mm a");
}

/**
 * General-purpose Malaysia-time formatter for callers that need a custom
 * date-fns format string (e.g. "yyyy-MM-dd" day keys for grouping/bucketing).
 */
export function formatMY(date: Date | string, formatStr: string) {
  return formatInTimeZone(new Date(date), MY_TIME_ZONE, formatStr);
}

/** For <input type="datetime-local"> default values */
export function toDateTimeLocal(date: Date | string) {
  return formatInTimeZone(new Date(date), MY_TIME_ZONE, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Parses a naive "yyyy-MM-dd'T'HH:mm" string (from <input type="datetime-local">)
 * as Malaysia time rather than the runtime's local timezone. Needed because
 * server actions run on Node, whose local timezone (UTC) differs from the
 * browser's — a bare `new Date(string)` would shift the stored instant.
 */
export function parseMYDateTimeLocal(value: string): Date {
  return fromZonedTime(value, MY_TIME_ZONE);
}

/** First letters of the first two words, uppercased — avatar fallbacks. */
export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Strips HTML tags for plain-text excerpts (card previews, meta tags). */
export function stripHtml(source: string) {
  return source
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
