import {
  drizzle as drizzleNodePg,
  type NodePgDatabase,
} from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { env } from "@/env";
import * as schema from "./schema";

/**
 * Cache the database connection on the global object in development to
 * avoid creating a new connection on every HMR reload.
 * @see https://drizzle.dev/docs/tutorials/drizzle-nextjs-neon#connect-drizzle-orm-to-your-database
 */
type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { db?: Database };

function createDb(): Database {
  if (env.DATABASE_URL) {
    // Real PostgreSQL (production / when a server is available)
    return drizzleNodePg(env.DATABASE_URL, { schema });
  }
  // Embedded PostgreSQL (PGlite) persisted to ./.pglite — zero-config dev.
  // Query API is identical, so we share the NodePg type.
  return drizzlePglite(".pglite", {
    schema,
  }) as unknown as Database;
}

export const db: Database = globalForDb.db ?? createDb();

if (env.NODE_ENV !== "production") globalForDb.db = db;

export * from "./schema";
