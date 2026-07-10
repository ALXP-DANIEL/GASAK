import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    IS_MAINTENANCE: z.enum(["true", "false"]).default("false"),
    AUTH_SECRET: z.string().min(1),
    DATABASE_URL: z.string(),
    UPLOADTHING_TOKEN: z.string().min(1),
    BILLPLZ_API_KEY: z.string().optional(),
    BILLPLZ_COLLECTION_ID: z.string().optional(),
    BILLPLZ_X_SIGNATURE_KEY: z.string().optional(),
    BILLPLZ_SANDBOX: z.enum(["true", "false"]).default("true"),
    CHALLONGE_API_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    IS_MAINTENANCE: process.env.IS_MAINTENANCE,
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    BILLPLZ_API_KEY: process.env.BILLPLZ_API_KEY,
    BILLPLZ_COLLECTION_ID: process.env.BILLPLZ_COLLECTION_ID,
    BILLPLZ_X_SIGNATURE_KEY: process.env.BILLPLZ_X_SIGNATURE_KEY,
    BILLPLZ_SANDBOX: process.env.BILLPLZ_SANDBOX,
    CHALLONGE_API_KEY: process.env.CHALLONGE_API_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  emptyStringAsUndefined: true,
});
