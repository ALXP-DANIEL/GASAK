import { v7 as uuidv7 } from "uuid";

/**
 * Generates a UUIDv7 — time-ordered, so IDs sort chronologically and stay
 * index-friendly, unlike random UUIDv4. Used as the default for every
 * application-owned primary key.
 */
export function generateId() {
  return uuidv7();
}
