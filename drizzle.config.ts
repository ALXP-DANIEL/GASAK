import { defineConfig } from "drizzle-kit";
import { env } from "@/env";

const usePglite = !env.DATABASE_URL;

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  tablesFilter: ["gasak_*", "user", "session", "account", "verification"],
  ...(usePglite
    ? { driver: "pglite", dbCredentials: { url: ".pglite" } }
    : { dbCredentials: { url: env.DATABASE_URL as string } }),
});
