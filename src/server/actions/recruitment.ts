"use server";

import { randomInt } from "node:crypto";
import { logActivity } from "@server/activity-log";
import { auth } from "@server/auth";
import { actionOrgUser, getManagedSquadIds } from "@server/authz";
import {
  applicationStatusEnum,
  applications,
  db,
  playerProfiles,
  squadMembers,
  squadRoleEnum,
  squads,
  user,
} from "@server/db";
import { userOrgRole } from "@server/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

function revalidateRecruitment() {
  revalidatePath("/dashboard/recruitment");
  revalidatePath("/dashboard");
}

export async function assignApplication(
  applicationId: string,
  leaderId: string,
): Promise<ActionResult> {
  const actor = await actionOrgUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const leader = await db.query.user.findFirst({
    where: eq(user.id, leaderId),
  });
  if (!leader) return { ok: false, error: "Pick a valid squad manager" };
  const managedSquadIds = await getManagedSquadIds(leader.id);
  if (managedSquadIds.length === 0) {
    return { ok: false, error: "Pick a valid squad manager" };
  }

  const [row] = await db
    .update(applications)
    .set({
      assignedLeaderId: leaderId,
      status: "under_review",
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId))
    .returning();
  if (!row) return { ok: false, error: "Application not found" };
  await logActivity({
    actor,
    action: "assign",
    entityType: "application",
    entityId: row.id,
    description: `Assigned application from ${row.fullName} to ${leader.name}`,
  });

  revalidateRecruitment();
  return { ok: true, message: `Assigned to ${leader.name}` };
}

const statusSchema = z.object({
  applicationId: z.uuid(),
  status: z.enum(applicationStatusEnum.enumValues),
  reviewNotes: z.string().optional(),
});

export async function updateApplicationStatus(
  input: z.infer<typeof statusSchema>,
): Promise<ActionResult> {
  const actor = await actionOrgUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, parsed.data.applicationId),
  });
  if (!application) return { ok: false, error: "Application not found" };

  if (
    userOrgRole(actor) !== "admin" &&
    application.assignedLeaderId !== actor.id
  ) {
    return { ok: false, error: "This application is not assigned to you" };
  }

  await db
    .update(applications)
    .set({
      status: parsed.data.status,
      reviewNotes: parsed.data.reviewNotes ?? application.reviewNotes,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, application.id));
  await logActivity({
    actor,
    action: "update",
    entityType: "application",
    entityId: application.id,
    description: `Changed ${application.fullName} application status to ${parsed.data.status}`,
  });

  revalidateRecruitment();
  return { ok: true, message: "Application updated" };
}

const onboardSchema = z.object({
  applicationId: z.uuid(),
  email: z.email("Enter a valid login email"),
  squadId: z.uuid("Pick a squad"),
  squadRole: z.enum(squadRoleEnum.enumValues),
  tempPassword: z.string().min(8, "Use at least 8 characters").optional(),
});

function generateTempPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let password = "";
  for (let i = 0; i < 12; i++) password += chars[randomInt(chars.length)];
  return password;
}

/**
 * Final step of the recruitment workflow: turn an accepted application into a
 * portal account with a prefilled player profile and a squad slot. Returns the
 * temporary password so the admin can hand it to the player.
 */
export async function onboardApplicant(
  input: z.infer<typeof onboardSchema>,
): Promise<ActionResult> {
  const actor = await actionOrgUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = onboardSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, parsed.data.applicationId),
  });
  if (!application) return { ok: false, error: "Application not found" };
  if (application.status !== "accepted") {
    return { ok: false, error: "Only accepted applications can be onboarded" };
  }

  // The login email is set at onboard time and may differ from the contact
  // email collected on the public form (which is used only for outreach).
  const email = parsed.data.email.toLowerCase();
  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  });
  if (existing) {
    return {
      ok: false,
      error:
        "An account with this email already exists — assign them via Squads instead",
    };
  }

  const squad = await db.query.squads.findFirst({
    where: and(eq(squads.id, parsed.data.squadId), eq(squads.archived, false)),
  });
  if (!squad) return { ok: false, error: "Squad not found" };

  const tempPassword =
    parsed.data.tempPassword?.trim() || generateTempPassword();
  // createUser (admin plugin) creates the account + hashed credential without
  // opening a session, so the admin who is onboarding stays logged in.
  const signup = await auth.api.createUser({
    body: {
      name: application.fullName,
      email,
      password: tempPassword,
      role: "user",
    },
  });

  await db.insert(playerProfiles).values({
    userId: signup.user.id,
    fullName: application.fullName,
    ign: application.ign,
    mlbbId: application.mlbbId,
    serverId: application.serverId,
    phone: application.phone,
    preferredLanes: application.preferredLanes,
    peakRank: application.peakRank,
  });

  await db.insert(squadMembers).values({
    squadId: squad.id,
    userId: signup.user.id,
    squadRole: parsed.data.squadRole,
  });
  await logActivity({
    actor,
    action: "onboard",
    entityType: "application",
    entityId: application.id,
    description: `Onboarded ${application.fullName} to ${squad.name}`,
  });

  revalidateRecruitment();
  revalidatePath("/dashboard/squads");
  revalidatePath("/dashboard/users");
  revalidatePath("/squads");
  updateTag("squads");
  updateTag("players");
  return {
    ok: true,
    message: `${application.fullName} onboarded to ${squad.name}`,
    data: { email, tempPassword },
  };
}
