"use server";

import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { userRole } from "@/lib/session";
import { actionUser } from "@/server/authz";
import {
  applicationStatusEnum,
  applications,
  db,
  playerProfiles,
  squadMembers,
  squadRoleEnum,
  squads,
  user,
} from "@/server/db";
import type { ActionResult } from "./public";

function revalidateRecruitment() {
  revalidatePath("/old/dashboard/recruitment");
  revalidatePath("/old/dashboard");
}

export async function assignApplication(
  applicationId: string,
  leaderId: string,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const leader = await db.query.user.findFirst({
    where: eq(user.id, leaderId),
  });
  if (leader?.role !== "leader") {
    return { ok: false, error: "Pick a valid squad leader" };
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
  const actor = await actionUser("admin", "leader");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, parsed.data.applicationId),
  });
  if (!application) return { ok: false, error: "Application not found" };

  if (
    userRole(actor) === "leader" &&
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

  revalidateRecruitment();
  return { ok: true, message: "Application updated" };
}

const onboardSchema = z.object({
  applicationId: z.uuid(),
  squadId: z.uuid("Pick a squad"),
  squadRole: z.enum(squadRoleEnum.enumValues),
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
  const actor = await actionUser("admin");
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

  const email = application.email.toLowerCase();
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

  const tempPassword = generateTempPassword();
  const signup = await auth.api.signUpEmail({
    body: {
      name: application.fullName,
      email,
      password: tempPassword,
    },
  });

  await db
    .update(user)
    .set({ role: "member" })
    .where(eq(user.id, signup.user.id));

  await db.insert(playerProfiles).values({
    userId: signup.user.id,
    fullName: application.fullName,
    ign: application.ign,
    mlbbId: application.mlbbId,
    serverId: application.serverId,
    phone: application.phone,
    preferredLane: application.preferredLane,
    currentRank: application.currentRank,
  });

  await db.insert(squadMembers).values({
    squadId: squad.id,
    userId: signup.user.id,
    squadRole: parsed.data.squadRole,
  });

  revalidateRecruitment();
  revalidatePath("/old/dashboard/squads");
  revalidatePath("/old/dashboard/users");
  revalidatePath("/old/players");
  return {
    ok: true,
    message: `${application.fullName} onboarded to ${squad.name}`,
    data: { email, tempPassword },
  };
}
