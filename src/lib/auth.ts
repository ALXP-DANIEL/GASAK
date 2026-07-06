import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { env } from "@/env";
import { db } from "@/server/db";

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
  emailAndPassword: {
    enabled: true,
    // No SMTP configured in V1 — the reset link is printed to the server
    // console so an admin can forward it manually.
    sendResetPassword: async ({ user, url }) => {
      console.log(`[GASAK] Password reset for ${user.email}: ${url}`);
    },
  },
  plugins: [
    admin({ adminRoles: ["admin"], defaultRole: "user" }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
