import { type SessionUser, userOrgRole } from "@lib/session";
import { activityLogs, db } from "@server/db";
import { revalidatePath } from "next/cache";

type ActivityInput = {
  actor?: SessionUser | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
};

export async function logActivity({
  actor,
  action,
  entityType,
  entityId,
  description,
}: ActivityInput) {
  await db.insert(activityLogs).values({
    actorId: actor?.id ?? null,
    actorName: actor?.name ?? null,
    actorEmail: actor?.email ?? null,
    actorRole: actor ? userOrgRole(actor) : null,
    action,
    entityType,
    entityId: entityId ?? null,
    description,
  });

  revalidatePath("/dashboard/logs");
}
