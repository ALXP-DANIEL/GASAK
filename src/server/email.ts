import "server-only";

import { Resend } from "resend";
import { env } from "@/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

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
    throw new Error("Failed to send reset email");
  }
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
    throw new Error("Failed to send welcome email");
  }
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
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#0c0c0e;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0c0c0e;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#141417;border:1px solid #26262b;border-top:3px solid #e0af3b;">
            <tr>
              <td style="padding:32px 32px 24px;">
                <p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#e0af3b;">GASAK Esports</p>
                <h1 style="margin:16px 0 0;font-size:24px;line-height:1.3;text-transform:uppercase;letter-spacing:1px;color:#f4f4f5;">Reset your password</h1>
                <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:#a1a1aa;">
                  Hi ${escapeHtml(userName)}, we received a request to reset the password for
                  your account <strong style="color:#f4f4f5;">${escapeHtml(accountEmail)}</strong>.
                  Click the button below to choose a new one.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;">
                <a href="${url}" style="display:inline-block;background-color:#e0af3b;color:#141417;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 28px;">Reset password</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.7;color:#71717a;">
                  This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email — your password stays unchanged.
                </p>
                <p style="margin:16px 0 0;font-size:12px;line-height:1.7;color:#71717a;word-break:break-all;">
                  Button not working? Paste this link into your browser:<br />
                  <a href="${url}" style="color:#e0af3b;">${url}</a>
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0;font-size:11px;color:#52525b;">© GASAK Esports · gasak.my</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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
    ? `Congratulations — you've been accepted into <strong style="color:#f4f4f5;">${escapeHtml(squadName)}</strong> at GASAK Esports! Your player portal account is ready.`
    : "Your GASAK Esports portal account is ready.";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#0c0c0e;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0c0c0e;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#141417;border:1px solid #26262b;border-top:3px solid #e0af3b;">
            <tr>
              <td style="padding:32px 32px 24px;">
                <p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#e0af3b;">GASAK Esports</p>
                <h1 style="margin:16px 0 0;font-size:24px;line-height:1.3;text-transform:uppercase;letter-spacing:1px;color:#f4f4f5;">${squadName ? "Welcome to the team" : "Your account is ready"}</h1>
                <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:#a1a1aa;">
                  Hi ${escapeHtml(userName)}, ${intro}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0c0c0e;border:1px solid #26262b;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Login email</p>
                      <p style="margin:4px 0 0;font-size:14px;color:#f4f4f5;font-family:Consolas,Menlo,monospace;">${escapeHtml(loginEmail)}</p>
                      <p style="margin:16px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Temporary password</p>
                      <p style="margin:4px 0 0;font-size:14px;color:#f4f4f5;font-family:Consolas,Menlo,monospace;">${escapeHtml(tempPassword)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px;">
                <a href="${loginUrl}" style="display:inline-block;background-color:#e0af3b;color:#141417;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 28px;">Sign in</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.7;color:#71717a;">
                  For security you'll be asked to set a new password the first time you log in.
                  Keep these details private and delete this email once you've signed in.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0;font-size:11px;color:#52525b;">© GASAK Esports · gasak.my</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
