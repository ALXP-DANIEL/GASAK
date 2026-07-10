import { format } from "date-fns";

export function formatRM(sen: number) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(sen / 100);
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "d MMM yyyy");
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "d MMM yyyy, h:mm a");
}

export function formatTime(date: Date | string) {
  return format(new Date(date), "h:mm a");
}

/** For <input type="datetime-local"> default values */
export function toDateTimeLocal(date: Date | string) {
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
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
