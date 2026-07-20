"use server";

import { randomInt, randomUUID } from "node:crypto";
import {
  personalEmailConfirmSchema,
  personalEmailRequestSchema,
} from "@features/auth/schema";
import type {
  AuthActionResult,
  PersonalEmailConfirmInput,
  PersonalEmailRequestInput,
} from "@features/auth/types";
import { logActivity } from "@server/activity-log";
import { db, user, verification } from "@server/db";
import { sendPersonalEmailVerificationEmail } from "@server/email";
import { requireUser } from "@server/session";
import { and, eq, gt } from "drizzle-orm";

/** Verification rows for this flow are namespaced per user. */
function identifierFor(userId: string) {
  return `personal-email:${userId}`;
}

const CODE_TTL_MS = 10 * 60 * 1000;

/**
 * Step 1 — the user proposes a personal inbox. A 6-digit code is emailed
 * there; nothing is saved on the account until the code is confirmed.
 */
export async function requestPersonalEmailCode(
  input: PersonalEmailRequestInput,
): Promise<AuthActionResult<{ email: string }>> {
  const actor = await requireUser();

  const parsed = personalEmailRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const email = parsed.data.email.trim().toLowerCase();

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const identifier = identifierFor(actor.id);

  try {
    // One pending code per user — a new request replaces the old one.
    await db
      .delete(verification)
      .where(eq(verification.identifier, identifier));
    await db.insert(verification).values({
      id: randomUUID(),
      identifier,
      value: JSON.stringify({ email, code }),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });

    await sendPersonalEmailVerificationEmail({
      to: email,
      userName: actor.name,
      accountEmail: actor.email,
      code,
    });

    return { ok: true, data: { email } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send the code",
    };
  }
}

/**
 * Step 2 — the code from the inbox proves ownership; only then is the
 * address stored as the account's personal email.
 */
export async function confirmPersonalEmailCode(
  input: PersonalEmailConfirmInput,
): Promise<AuthActionResult<{ email: string }>> {
  const actor = await requireUser();

  const parsed = personalEmailConfirmSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const identifier = identifierFor(actor.id);
  const record = await db.query.verification.findFirst({
    where: and(
      eq(verification.identifier, identifier),
      gt(verification.expiresAt, new Date()),
    ),
  });
  if (!record) {
    return {
      ok: false,
      error: "Code expired or not requested — send a new one.",
    };
  }

  let pending: { email: string; code: string };
  try {
    pending = JSON.parse(record.value);
  } catch {
    return { ok: false, error: "Invalid verification state — try again." };
  }

  if (pending.code !== parsed.data.code) {
    return { ok: false, error: "That code doesn't match — check the email." };
  }

  await db
    .update(user)
    .set({ personalEmail: pending.email })
    .where(eq(user.id, actor.id));
  await db.delete(verification).where(eq(verification.identifier, identifier));

  await logActivity({
    actor,
    action: "verify_personal_email",
    entityType: "auth",
    entityId: actor.id,
    description: `Verified personal email ${pending.email}`,
  });

  return { ok: true, data: { email: pending.email } };
}
