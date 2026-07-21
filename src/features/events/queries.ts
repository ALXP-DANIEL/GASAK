import { db, events } from "@server/db";
import { eq } from "drizzle-orm";

export async function getEvent(id: string) {
  return db.query.events.findFirst({
    where: eq(events.id, id),
    with: { squad: true, tournament: true },
  });
}
