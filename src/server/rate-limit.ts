import "server-only";

import { headers } from "next/headers";

/**
 * Fixed-window in-memory rate limiter keyed by caller IP. First line of
 * defense for public (unauthenticated) server actions.
 *
 * In-memory state is per server instance, so on serverless this is
 * best-effort — each instance enforces its own window. Durable abuse
 * protection is layered on top with DB-backed caps (see recentCountExceeds
 * usage in the public actions). Swap the Map for Upstash/Redis if the app
 * ever needs a shared limit across instances.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS = 10_000;

function sweep(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export async function callerIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/** Returns true when the call is allowed, false when the window is full. */
export async function rateLimit(
  action: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const key = `${action}:${await callerIp()}`;
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export const RATE_LIMITED_ERROR =
  "Too many requests — please wait a moment and try again.";
