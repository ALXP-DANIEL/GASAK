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
  url,
}: {
  to: string;
  userName: string;
  url: string;
}) {
  if (!resend) {
    console.log(`[GASAK] Password reset for ${to}: ${url}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: "Reset your GASAK password",
    html: passwordResetHtml({ userName, url }),
    text: [
      `Hi ${userName},`,
      "",
      "We received a request to reset your GASAK password.",
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

function passwordResetHtml({
  userName,
  url,
}: {
  userName: string;
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
                  Hi ${escapeHtml(userName)}, we received a request to reset the password for this account.
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
