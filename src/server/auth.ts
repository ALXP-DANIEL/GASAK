import "server-only";

import { nextCookies } from "better-auth/next-js";
import { createAuth } from "./auth-config";

// The shared config lives in `auth-config.ts` so plain Node scripts (db:seed)
// can build an identical instance without pulling in Next.js internals.
export const auth = createAuth([nextCookies()]);

export type Session = typeof auth.$Infer.Session;
