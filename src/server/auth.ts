import "server-only";

import { db } from "@server/db";
import { sendPasswordResetEmail } from "@server/email";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { env } from "@/env";

export const auth = betterAuth({
  appName: "GASAK",
  secret: env.AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_SITE_URL,
  // In dev, trust whatever origin the request came from (e.g. your phone
  // hitting the dev server over LAN IP) instead of only NEXT_PUBLIC_SITE_URL.
  trustedOrigins:
    env.NODE_ENV === "development"
      ? async (request) => {
          const origin = request?.headers.get("origin");
          return origin ? [origin] : [];
        }
      : undefined,
  database: drizzleAdapter(db, { provider: "pg" }),
  user: {
    additionalFields: {
      mustChangePassword: {
        type: "boolean",
        defaultValue: false,
        input: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour, matches the email copy
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        userName: user.name,
        url,
      });
    },
  },
  plugins: [
    admin({ adminRoles: ["admin"], defaultRole: "user" }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
