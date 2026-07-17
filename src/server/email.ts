import "server-only";

import { logActivity } from "@server/activity-log";
import { Resend } from "resend";
import { env } from "@/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/** Fire-and-forget audit entry — a logging failure must never fail a send. */
async function logEmail(description: string) {
  try {
    await logActivity({
      action: "email",
      entityType: "email",
      description,
    });
  } catch (err) {
    console.error("[GASAK] Failed to log email activity:", err);
  }
}

/**
 * Send the password-reset email via Resend. When RESEND_API_KEY is not set
 * (local dev), the link is printed to the server console instead so the
 * flow stays testable without a key.
 */
export async function sendPasswordResetEmail({
  to,
  userName,
  accountEmail,
  url,
}: {
  /** Delivery inbox — the user's personal email when set, else the account email. */
  to: string;
  userName: string;
  /** The @gasak.my login this reset is for (one inbox can back several accounts). */
  accountEmail: string;
  url: string;
}) {
  if (!resend) {
    console.log(
      `[GASAK] Password reset for ${accountEmail} (to ${to}): ${url}`,
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: "Reset your GASAK password",
    html: passwordResetHtml({ userName, accountEmail, url }),
    text: [
      `Hi ${userName},`,
      "",
      `We received a request to reset the password for your GASAK account ${accountEmail}.`,
      `Reset it here: ${url}`,
      "",
      "This link expires in 1 hour. If you didn't request this, you can ignore this email.",
    ].join("\n"),
  });

  if (error) {
    console.error(`[GASAK] Failed to send reset email to ${to}:`, error);
    await logEmail(
      `Failed to send password-reset email for ${accountEmail} to ${to}`,
    );
    throw new Error("Failed to send reset email");
  }

  await logEmail(`Sent password-reset email for ${accountEmail} to ${to}`);
}

/**
 * Onboarding email — congratulates a newly accepted player (or a freshly
 * created portal user) and shares their login details. The temporary
 * password is only acceptable in email because mustChangePassword forces a
 * change on first login.
 */
export async function sendWelcomeEmail({
  to,
  userName,
  loginEmail,
  tempPassword,
  squadName,
}: {
  to: string;
  userName: string;
  loginEmail: string;
  tempPassword: string;
  squadName?: string;
}) {
  if (!resend) {
    console.log(
      `[GASAK] Welcome email for ${loginEmail} (to ${to}) — temp password: ${tempPassword}`,
    );
    return;
  }

  const loginUrl = `${env.NEXT_PUBLIC_SITE_URL}/login`;
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: squadName
      ? `Welcome to GASAK — you're in ${squadName}!`
      : "Welcome to GASAK — your account is ready",
    html: welcomeHtml({
      userName,
      loginEmail,
      tempPassword,
      squadName,
      loginUrl,
    }),
    text: [
      `Hi ${userName},`,
      "",
      squadName
        ? `Congratulations — you've been accepted into ${squadName} at GASAK Esports!`
        : "Your GASAK Esports portal account is ready.",
      "",
      `Login: ${loginEmail}`,
      `Temporary password: ${tempPassword}`,
      `Sign in at: ${loginUrl}`,
      "",
      "You'll be asked to set a new password the first time you log in.",
    ].join("\n"),
  });

  if (error) {
    console.error(`[GASAK] Failed to send welcome email to ${to}:`, error);
    await logEmail(
      `Failed to send welcome email for ${loginEmail} to ${to}${squadName ? ` (${squadName})` : ""}`,
    );
    throw new Error("Failed to send welcome email");
  }

  await logEmail(
    `Sent welcome email for ${loginEmail} to ${to}${squadName ? ` (${squadName})` : ""}`,
  );
}

/**
 * Verification code for confirming a personal email — proves the user owns
 * the inbox before password resets start delivering there.
 */
export async function sendPersonalEmailVerificationEmail({
  to,
  userName,
  accountEmail,
  code,
}: {
  to: string;
  userName: string;
  /** The @gasak.my login this personal email will be attached to. */
  accountEmail: string;
  code: string;
}) {
  if (!resend) {
    console.log(
      `[GASAK] Personal email verification for ${accountEmail} (to ${to}) — code: ${code}`,
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `${code} is your GASAK verification code`,
    html: personalEmailVerificationHtml({ userName, accountEmail, code }),
    text: [
      `Hi ${userName},`,
      "",
      `Use this code to confirm this inbox as the personal email for your GASAK account ${accountEmail}:`,
      "",
      code,
      "",
      "The code expires in 10 minutes. If you didn't request this, you can ignore this email.",
    ].join("\n"),
  });

  if (error) {
    console.error(
      `[GASAK] Failed to send personal email verification to ${to}:`,
      error,
    );
    await logEmail(
      `Failed to send personal-email verification for ${accountEmail} to ${to}`,
    );
    throw new Error("Failed to send verification email");
  }

  await logEmail(
    `Sent personal-email verification for ${accountEmail} to ${to}`,
  );
}

/* ------------------------------------------------------------------------ */
/* Templates — corner-cut HUD card matching the app's esports design.       */
/* clip-path doesn't work in email clients, so the cut corners (top-right   */
/* and bottom-left, like the app's .corner-cut panels) are built from       */
/* border-triangle cells inside a fixed 3-column table.                     */
/* ------------------------------------------------------------------------ */

const PAGE_BG = "#0c0c0e";
const CARD_BG = "#141417";
const PANEL_BG = "#0c0c0e";
const BORDER = "#26262b";
const GOLD = "#e0af3b";
const TEXT = "#f4f4f5";
const MUTED = "#a1a1aa";
const FAINT = "#71717a";
const CUT = 14;

/** Uppercase micro-label with the app's gold accent tick. */
function tickLabel(text: string) {
  return `<p style="margin:0;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${FAINT};"><span style="display:inline-block;width:3px;height:10px;background-color:${GOLD};margin-right:8px;"></span>${text}</p>`;
}

function goldButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background-color:${GOLD};color:${CARD_BG};font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 28px;">${label}</a>`;
}

/**
 * Wraps content in the corner-cut card: gold top bar, cut top-right and
 * bottom-left corners, dark page background, gasak.my footer.
 */
function emailShell(content: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:${PAGE_BG};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAGE_BG};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
            <tr>
              <td style="width:${CUT}px;background-color:${CARD_BG};border-top:3px solid ${GOLD};font-size:0;line-height:0;">&nbsp;</td>
              <td style="background-color:${CARD_BG};border-top:3px solid ${GOLD};font-size:0;line-height:0;">&nbsp;</td>
              <td style="width:${CUT}px;padding:0;font-size:0;line-height:0;vertical-align:top;">
                <div style="width:0;height:0;border-bottom:${CUT}px solid ${CARD_BG};border-right:${CUT}px solid ${PAGE_BG};font-size:0;line-height:0;"></div>
              </td>
            </tr>
            <tr>
              <td colspan="3" style="background-color:${CARD_BG};padding:18px 32px 32px;">
${content}
              </td>
            </tr>
            <tr>
              <td style="width:${CUT}px;padding:0;font-size:0;line-height:0;vertical-align:bottom;">
                <div style="width:0;height:0;border-top:${CUT}px solid ${CARD_BG};border-left:${CUT}px solid ${PAGE_BG};font-size:0;line-height:0;"></div>
              </td>
              <td style="background-color:${CARD_BG};font-size:0;line-height:0;">&nbsp;</td>
              <td style="width:${CUT}px;background-color:${CARD_BG};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
          </table>
          <p style="margin:24px 0 0;font-size:11px;letter-spacing:1px;color:#52525b;">© GASAK ESPORTS · <a href="https://gasak.my" style="color:#52525b;text-decoration:none;">GASAK.MY</a></p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function passwordResetHtml({
  userName,
  accountEmail,
  url,
}: {
  userName: string;
  accountEmail: string;
  url: string;
}) {
  return emailShell(`
                <p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${GOLD};">GASAK Esports</p>
                <h1 style="margin:16px 0 0;font-size:24px;line-height:1.3;text-transform:uppercase;letter-spacing:1px;color:${TEXT};">Reset your password</h1>
                <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:${MUTED};">
                  Hi ${escapeHtml(userName)}, we received a request to reset the password for
                  your account <strong style="color:${TEXT};">${escapeHtml(accountEmail)}</strong>.
                  Click the button below to choose a new one.
                </p>
                <div style="margin:24px 0 0;">${goldButton(url, "Reset password")}</div>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:${FAINT};">
                  This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email — your password stays unchanged.
                </p>
                <p style="margin:16px 0 0;font-size:12px;line-height:1.7;color:${FAINT};word-break:break-all;">
                  Button not working? Paste this link into your browser:<br />
                  <a href="${url}" style="color:${GOLD};">${url}</a>
                </p>`);
}

function welcomeHtml({
  userName,
  loginEmail,
  tempPassword,
  squadName,
  loginUrl,
}: {
  userName: string;
  loginEmail: string;
  tempPassword: string;
  squadName?: string;
  loginUrl: string;
}) {
  const intro = squadName
    ? `Congratulations — you've been accepted into <strong style="color:${TEXT};">${escapeHtml(squadName)}</strong> at GASAK Esports! Your player portal account is ready.`
    : "Your GASAK Esports portal account is ready.";

  return emailShell(`
                <p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${GOLD};">GASAK Esports</p>
                <h1 style="margin:16px 0 0;font-size:24px;line-height:1.3;text-transform:uppercase;letter-spacing:1px;color:${TEXT};">${squadName ? "Welcome to the team" : "Your account is ready"}</h1>
                <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:${MUTED};">
                  Hi ${escapeHtml(userName)}, ${intro}
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background-color:${PANEL_BG};border:1px solid ${BORDER};border-left:3px solid ${GOLD};">
                  <tr>
                    <td style="padding:16px 20px;">
                      ${tickLabel("Login email")}
                      <p style="margin:6px 0 0;font-size:14px;color:${TEXT};font-family:Consolas,Menlo,monospace;">${escapeHtml(loginEmail)}</p>
                      <div style="margin-top:16px;">${tickLabel("Temporary password")}</div>
                      <p style="margin:6px 0 0;font-size:14px;color:${TEXT};font-family:Consolas,Menlo,monospace;">${escapeHtml(tempPassword)}</p>
                    </td>
                  </tr>
                </table>
                <div style="margin:24px 0 0;">${goldButton(loginUrl, "Sign in")}</div>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:${FAINT};">
                  For security you'll be asked to set a new password the first time you log in.
                  Keep these details private and delete this email once you've signed in.
                </p>`);
}

function personalEmailVerificationHtml({
  userName,
  accountEmail,
  code,
}: {
  userName: string;
  accountEmail: string;
  code: string;
}) {
  return emailShell(`
                <p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${GOLD};">GASAK Esports</p>
                <h1 style="margin:16px 0 0;font-size:24px;line-height:1.3;text-transform:uppercase;letter-spacing:1px;color:${TEXT};">Confirm your personal email</h1>
                <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:${MUTED};">
                  Hi ${escapeHtml(userName)}, enter this code in the portal to set this inbox
                  as the personal email for your account <strong style="color:${TEXT};">${escapeHtml(accountEmail)}</strong>.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background-color:${PANEL_BG};border:1px solid ${BORDER};border-left:3px solid ${GOLD};">
                  <tr>
                    <td style="padding:20px;" align="center">
                      ${tickLabel("Verification code")}
                      <p style="margin:10px 0 0;font-size:32px;letter-spacing:10px;color:${TEXT};font-family:Consolas,Menlo,monospace;">${escapeHtml(code)}</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:${FAINT};">
                  This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.
                </p>`);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
